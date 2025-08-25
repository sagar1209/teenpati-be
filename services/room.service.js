const { db } = require('../config/database');
const { Room, RoomUser, User } = db;

const createRoom = async (value,transaction) => {
  const room = await Room.create(value, { transaction });
  await RoomUser.create({
    room_id: room.id,
    user_id: value.owner_id
  }, { transaction });
  return room;
};

const findRoomUser = async (query) => {
  const membership = await RoomUser.findOne(query);
  return membership;
};

const findAllRoomUser = async (query) => {
  const players = await RoomUser.findAll(query);
  return players;
};

const addUserToRoom = async (value, transaction) => {
  const membership = await RoomUser.create(value, { transaction });
  return membership;
};

const findRoom = async (query) => {
  const room = await Room.findOne(query);
  return room;
};

const updateRoomById = async (id, value, transaction) => {
  const result = await Room.update(value, {
    where: { id },
    transaction,
  });
  return result;
};

const updateAllRoomUsers = async (roomId, value, transaction) => {
  const result = await RoomUser.update(value, {
    where: { room_id: roomId },
    transaction,
  });
  return result;
};

const collectPotAmount = async (roomId, potAmount, transaction) => {
  try {
    // Get all players in the room
    const roomUsers = await RoomUser.findAll({
      where: { room_id: roomId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "balance"],
        },
      ],
      transaction,
    });

    const updatePromises = [];
    const insufficientBalanceUsers = [];

    // Check balance and prepare updates
    for (const roomUser of roomUsers) {
      const user = roomUser.user;
      const currentBalance = parseFloat(user.balance);
      const requiredAmount = parseFloat(potAmount);

      if (currentBalance < requiredAmount) {
        insufficientBalanceUsers.push({
          userId: user.id,
          currentBalance,
          requiredAmount,
        });
      } else {
        // Deduct pot amount from user balance
        updatePromises.push(
          User.update(
            { balance: currentBalance - requiredAmount },
            {
              where: { id: user.id },
              transaction,
            }
          )
        );
      }
    }

    // If any user has insufficient balance, throw error
    if (insufficientBalanceUsers.length > 0) {
      throw new Error(
        `Insufficient balance for users: ${insufficientBalanceUsers
          .map((u) => `User ${u.userId} (Balance: ${u.currentBalance}, Required: ${u.requiredAmount})`)
          .join(", ")}`
      );
    }

    // Execute all balance updates
    await Promise.all(updatePromises);

    // Calculate total pot collected
    const totalPotCollected = potAmount * roomUsers.length;

    // Update room pot amounts
    await Room.update(
      { 
        current_pot_amount: totalPotCollected,
        limit_pot_amount: potAmount
      },
      {
        where: { id: roomId },
        transaction,
      }
    );

    return {
      success: true,
      playersCount: roomUsers.length,
      totalPotCollected: totalPotCollected,
      limitPotAmount: potAmount,
      currentPotAmount: totalPotCollected,
    };
  } catch (error) {
    throw error;
  }
};

const removeUserFromRoom = async (userId, transaction) => {
  await RoomUser.destroy({
    where: { user_id: userId },
    transaction,
  });
};

const findAllRoom = async (query) => {
  const rooms = await Room.findAll(query);
  return rooms;
};

const countRoom = async (query) => {
  const totalRows = await Room.count(query);
  return totalRows;
};

module.exports = {
  createRoom,
  findRoomUser,
  findAllRoomUser,
  addUserToRoom,
  findRoom,
  updateRoomById,
  updateAllRoomUsers,
  collectPotAmount,
  removeUserFromRoom,
  findAllRoom,
  countRoom,
};
