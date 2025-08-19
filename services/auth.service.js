const { db } = require("../config/database");
const { User, Role } = db;
const { Op } = require("sequelize");

const registerUser = async (value, transaction) => {
  // Check if user already exists
  const existingUser = await findUser({ where: { email: value.email } });
  if (existingUser) {
    // Delete existing user if found
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

const updateUserById = async (id, value, transaction) => {
  return await User.update(value, {
    where: { id },
    transaction,
  });
};

module.exports = {
  registerUser,
  findUser,
  updateUserById,
};
