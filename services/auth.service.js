const { db } = require("../config/database");
const { User, Role } = db;
const { Op } = require("sequelize");

const registerUser = async (value, transaction) => {
  const existingUser = await findUser({ where: { email: value.email } });
  if (existingUser) {
    await User.destroy({
      where: { email: value.email },
      force: true,
      transaction,
    });
  }

  const newUser = await User.create(value, { transaction });
  return newUser;
};

const findUser = async (query) => {
  return await User.findOne(query);
};

const findRole = async (query) => {
  return await Role.findOne(query);
};

const updateUserById = async (id, value, transaction) => {
  console.log(value,id);
  return await User.update(value, {
    where: { id },
    transaction,
  });
};

module.exports = {
  registerUser,
  findUser,
  findRole,
  updateUserById,
};
