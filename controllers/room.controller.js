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
const { ROOM_TYPE, ROOM_LIMIT } = require("../constants/room.constant");
const { db } = require("../config/database");
const { User } = db;

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
      type: ROOM_TYPE.PRIVATE,
      code: generateRoomCode(),
      owner_id: userId,
      pot_amount: value.pot_amount,
      max_players: ROOM_LIMIT.PRIVATE,
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
        type: ROOM_TYPE.PUBLIC,
        is_active: true,
        current_players: { [Op.lt]: ROOM_LIMIT.PUBLIC },
        pot_amount: value.pot_amount,
      },
    });

    if (!room) {
      const roomData = {
        owner_id: userId,
        pot_amount: value.pot_amount,
        type: ROOM_TYPE.PUBLIC,
        is_active: true,
        max_players: ROOM_LIMIT.PUBLIC,
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
        type: ROOM_TYPE.PRIVATE,
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
      where: { id: roomUser.room_id, is_active: true },
      transaction,
    });
    if (!room) {
      throw new ApiError("Room not found", 404);
    }

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

const getAllRooms = async (req, res) => {
  try {
    const {
      page = 1,
      rows = 10,
      pagination = "true",
      type = "all",
      sort = "updatedAt",
      order = "DESC",
    } = req.query;
    const paginationOptions =
      pagination == "true"
        ? {
            limit: rows,
            offset: (page - 1) * rows,
          }
        : {};

    const where = {
      type: type == "all" ? { [Op.ne]: null } : type,
      is_active: true,
    };

    const rooms = await roomService.findAllRoom({
      where,
      ...paginationOptions,
      order: [[sort, order]],
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    const totalRows = await roomService.countRoom({
      where,
    });

    return sendSuccessResponse(
      res,
      {
        rooms,
        totalCount: totalRows,
      },
      "Rooms fetched successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to get all rooms",
      error.statusCode || 500
    );
  }
};

const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    let room = await roomService.findRoom({
      where: {
        id,
        is_active: true,
        current_players: { [Op.gt]: 0 },
      },
    });

    if (!room) {
      throw new ApiError("Room not found", 404);
    }

    room = await roomService.findRoom({
      where: { id },
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "email"],
        },
        {
          model: User,
          as: "players",
          attributes: ["id", "username", "email", "balance"],
        },
      ],
    });

    return sendSuccessResponse(res, room, "Room fetched successfully", 200);
  } catch (error) {
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to get room by id",
      error.statusCode || 500
    );
  }
};

module.exports = {
  createPrivateRoom,
  createPublicRoom,
  joinPrivateRoom,
  leaveRoom,
  getAllRooms,
  getRoomById,
};
