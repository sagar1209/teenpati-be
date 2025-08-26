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
    // Get all players in the room
    const roomUsers = await RoomUser.findAll({
      where: { room_id: roomId , status: 'waiting'},
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "balance"],
        }
      ],
      transaction,
    });

    const updatePromises = [];
    const roomUserUpdatePromises = [];
    const usersList = [];
    let totalPotCollected = 0;
    let insufficientBalanceCount = 0;

    // Check balance and prepare updates
    for (const roomUser of roomUsers) {
      const user = roomUser.user;
      const currentBalance = parseFloat(user.balance);
      const requiredAmount = parseFloat(potAmount);
      const hasInsufficientBalance = currentBalance < requiredAmount;
      const newBalance = currentBalance - requiredAmount;

      if (hasInsufficientBalance) {
        insufficientBalanceCount++;
      }

      // Add user to the list with all required information
      usersList.push({
        userId: user.id,
        username: user.username,
        status: hasInsufficientBalance ? 'waiting' : 'running',
        insufficientBalance: hasInsufficientBalance,
        potAmount: requiredAmount,
        balance: currentBalance,
        newBalance: hasInsufficientBalance ? currentBalance : newBalance,
      });

      if (!hasInsufficientBalance) {
        // Deduct pot amount from user balance
        updatePromises.push(
          User.update(
            { balance: newBalance },
            {
              where: { id: user.id },
              transaction,
            }
          )
        );

        // Update room user status to running
        roomUserUpdatePromises.push(
          RoomUser.update(
            { status: 'running' },
            {
              where: { room_id: roomId, user_id: user.id },
              transaction,
            }
          )
        );

        totalPotCollected += requiredAmount;
      }
    }

    // Check if there are less than 2 players with sufficient balance
    const playersWithSufficientBalance = roomUsers.length - insufficientBalanceCount;
    if (playersWithSufficientBalance < 2) {
      throw new Error("Need at least 2 players with sufficient balance to start the game");
    }

    // Execute all balance updates and room user status updates
    await Promise.all([...updatePromises, ...roomUserUpdatePromises]);

    // Update room pot amounts
    await Room.update(
      { 
        total_collected_amount: totalPotCollected,
        room_status: 'running'
      },
      {
        where: { id: roomId },
        transaction,
      }
    );

    return {
      totalPotCollected: totalPotCollected,
      PotAmount: potAmount,
      players: usersList,
    };
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
