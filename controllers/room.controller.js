const { roomService } = require("../services");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/response.util");
const { ApiError } = require("../utils/apiError.util");
const { validateSchema } = require("../utils/validator.util");
const Joi = require("joi");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

const generateRoomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
const createPrivateRoom = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;

    // Validate request body
    const schema = Joi.object({
      pot_amount: Joi.number().positive().required(),
    });

    const value = validateSchema(schema, req.body);

    // Check if user has sufficient balance
    if (parseFloat(req.user.balance) < parseFloat(value.pot_amount)) {
      throw new ApiError("Insufficient balance", 400);
    }

    // Check if user is already in a room
    const existingMembership = await roomService.findRoomUser({
      where: { user_id: userId },
    });
    if (existingMembership) {
      throw new ApiError("User already in a room", 400);
    }

    const roomData = {
      type: "private",
      code: generateRoomCode(),
      owner_id: userId,
      pot_amount: value.pot_amount,
      max_players: 7,
      current_players: 1,
    };

    const room = await roomService.createRoom(roomData, transaction);
    await transaction.commit();
    return sendSuccessResponse(
      res,
      {
        id: room.id,
        code: room.code,
        type: room.type,
        max_players: room.max_players,
        current_players: room.current_players,
        pot_amount: room.pot_amount,
      },
      "Private room created successfully",
      201
    );
  } catch (error) {
    await transaction.rollback();
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to create private room",
      error.statusCode || 500
    );
  }
};

const createPublicRoom = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;

    const schema = Joi.object({
      pot_amount: Joi.number().positive().required(),
    });

    const value = validateSchema(schema, req.body);

    if (parseFloat(req.user.balance) < parseFloat(value.pot_amount)) {
      throw new ApiError("Insufficient balance", 400);
    }

    const existingMembership = await roomService.findRoomUser({
      where: { user_id: userId },
    });
    if (existingMembership) {
      throw new ApiError("User already in a room", 400);
    }

    let room = await roomService.findRoom({
      where: {
        type: "public",
        is_active: true,
        current_players: { [Op.lt]: 5 },
        pot_amount: value.pot_amount,
      },
    });

    if (!room) {
      const roomData = {
        owner_id: userId,
        pot_amount: value.pot_amount,
        type: "public",
        is_active: true,
        max_players: 5,
        current_players: 1,
      };
      room = await roomService.createRoom(roomData, transaction);
    } else {
      await roomService.addUserToRoom(
        { room_id: room.id, user_id: userId },
        transaction
      );
      await roomService.updateRoomById(
        room.id,
        { current_players: room.current_players + 1 },
        transaction
      );

      room = await roomService.findRoom({
        where: { id: room.id },
        transaction,
      });
    }

    await transaction.commit();
    return sendSuccessResponse(
      res,
      {
        id: room.id,
        type: room.type,
        max_players: room.max_players,
        current_players: room.current_players,
        pot_amount: room.pot_amount,
      },
      "Successfully joined public room",
      200
    );
  } catch (error) {
    await transaction.rollback();
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to join public room",
      error.statusCode || 500
    );
  }
};

const joinPrivateRoom = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const schema = Joi.object({
      code: Joi.string().length(6).required(),
    });

    const value = validateSchema(schema, req.body);

    const userId = req.user.id;

    const room = await roomService.findRoom({
      where: {
        code: value.code,
        type: "private",
        is_active: true,
      },
    });
    if (!room) {
      throw new ApiError("Room not found", 404);
    }

    if (room.current_players >= room.max_players) {
      throw new ApiError("Room is full", 400);
    }

    const existingMembership = await roomService.findRoomUser({
      where: { room_id: room.id, user_id: userId },
    });
    if (existingMembership) {
      throw new ApiError("User already in this room", 400);
    }

    const otherMembership = await roomService.findRoomUser({
      where: { user_id: userId },
    });
    if (otherMembership) {
      throw new ApiError("User already in another room", 400);
    }

    if (parseFloat(req.user.balance) < parseFloat(room.pot_amount)) {
      throw new ApiError("Insufficient balance", 400);
    }

    await roomService.addUserToRoom(
      { room_id: room.id, user_id: userId },
      transaction
    );

    await roomService.updateRoomById(
      room.id,
      { current_players: room.current_players + 1 },
      transaction
    );

    await transaction.commit();
    return sendSuccessResponse(
      res,
      {
        id: room.id,
        code: room.code,
        type: room.type,
        max_players: room.max_players,
        current_players: room.current_players + 1,
        pot_amount: room.pot_amount,
      },
      "Successfully joined private room",
      200
    );
  } catch (error) {
    await transaction.rollback();
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to join private room",
      error.statusCode || 500
    );
  }
};

const leaveRoom = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const roomUser = await roomService.findRoomUser({
      where: {
        user_id: userId,
      },
    });
    if (!roomUser) {
      throw new ApiError("User not in a room", 404);
    }

    await roomService.removeUserFromRoom(userId, transaction);

    const room = await roomService.findRoom({
      where: { id: roomUser.room_id },
      transaction,
    });
    await roomService.updateRoomById(
      room.id,
      {
        current_players: room.current_players - 1,
        is_active: room.current_players == 1 ? false : true,
      },
      transaction
    );

    await transaction.commit();
    return sendSuccessResponse(res, null, "Successfully left the room", 200);
  } catch (error) {
    await transaction.rollback();
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to leave room",
      error.statusCode || 500
    );
  }
};

module.exports = {
  createPrivateRoom,
  createPublicRoom,
  joinPrivateRoom,
  leaveRoom,
};
