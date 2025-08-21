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

const removeUserFromRoom = async (userId, transaction) => {
  await RoomUser.destroy({
    where: { user_id: userId },
    transaction,
  });
};

module.exports = {
  createRoom,
  findRoomUser,
  addUserToRoom,
  findRoom,
  updateRoomById,
  removeUserFromRoom,
};
