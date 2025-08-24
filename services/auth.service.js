const { db } = require("../config/database");
const { User, Role , AuthCode} = db;
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


const findAllUsers = async (query) => {
  return await User.findAll(query);
};
const updateUserById = async (id, value, transaction) => {
  const user = await User.update(value, {
    where: { id },
    transaction,
  });
  return user;
};

const countUsers = async (query) => { 
  return await User.count(query);
};

const addAuthCode = async (value, transaction) => {
  await AuthCode.create(value, { transaction });
};

const verifyOTP = async (userId, otpCode, transaction) => {
  const otpRecord = await AuthCode.findOne({
    where: {
      user_id: userId
    },
    order: [["createdAt", "DESC"]]
  });

  if (!otpRecord) return false;

  if (
    otpRecord.otp_code == otpCode &&
    otpRecord.is_verified === false &&
    otpRecord.expiration > new Date()
  ) {
    await AuthCode.update(
      { is_verified: true },
      { where: { id: otpRecord.id }, transaction }
    );

    return true;
  }

  return false;
};

module.exports = {
  registerUser,
  findUser,
  findRole,
  findAllUsers,
  updateUserById,
  countUsers,
  addAuthCode,
  verifyOTP,
};
