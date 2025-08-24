const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { db } = require("../config/database");
const { Role } = db;
const { authService, paymentService } = require("../services");
const { ROLE } = require("../constants/rolePermission.constant");
const { ENV_VARIABLE } = require("../constants/envVariable.constant");
const { validateSchema } = require("../utils/validator.util");
const { generatehashPassword, comparePassword } = require("../utils/hash.util");
const { Op } = require("sequelize");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/response.util");
const { ApiError } = require("../utils/apiError.util");
const renderEjsFile = require("../utils/renderEjsFile.util");
const { sendMailAsync } = require("../utils/sendMail.util");
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const schema = Joi.object({
      username: Joi.string()
        .pattern(/^[A-Za-z0-9]+$/)
        .message("Username can only contain letters (a-z) and numbers")
        .min(8)
        .required()
        .trim()
        .lowercase(),
      email: Joi.string().email().required().lowercase(),
      contact_number: Joi.string().allow(null).optional(),
      password: Joi.string().min(8).required(),
    });

    const value = validateSchema(schema, req.body);

    const existingUser = await authService.findUser({
      where: {
        email: value.email,
      },
    });
    if (existingUser) {
      if (existingUser.is_verified) {
        throw new ApiError("Email already exists", 400);
      }
    }

    const existingUserByUsername = await authService.findUser({
      where: {
        username: value.username,
        email: { [Op.ne]: value.email }, // Only check if different email (different person)
      },
    });

    if (existingUserByUsername) {
      throw new ApiError("Username already exists", 400);
    }

    const hashedPassword = await generatehashPassword(value.password);
    // get user role id
    const userRole = await authService.findRole({
      where: { role_name: ROLE.USER },
    });

    value.role_id = parseInt(userRole.id);
    value.is_active = true;
    value.password = hashedPassword;

    const user = await authService.registerUser(value, transaction);

    // Generate verification code (OTP)
    const otp_code = generateVerificationCode();
    const expirationTimeInMinutes = 5;
    const expiration = new Date(Date.now() + expirationTimeInMinutes * 60000);

    // Add auth code
    await authService.addAuthCode(
      {
        user_id: user.id,
        otp_code,
        expiration,
      },
      transaction
    );

    const emailBody = await renderEjsFile(
      "verificationOTPForRegistrationMAIL.ejs",
      {
        otp: otp_code,
        expirationTimeInMinutes
      }
    );

    console.log(emailBody,"emailBody");

    sendMailAsync({
      email: value.email,
      subject: `Verify Your Email Address`,
      body: emailBody
    });

    await transaction.commit();
    return sendSuccessResponse(
      res,
      user,
      "Code has been sent successfully",
      201
    );
  } catch (error) {
    await transaction.rollback();
    return sendErrorResponse(
      res,
      [],
      error.message || "Error to register user",
      error.statusCode || 500
    );
  }
};

const login = async (req, res) => {
  try {
    const schema = Joi.object({
      username: Joi.string().required().lowercase().trim(),
      password: Joi.string().min(8).required(),
    });

    const value = validateSchema(schema, req.body);

    const { username, password } = value;

    // Find user by username
    const user = await authService.findUser({
      where: { username: username , is_active: true, is_verified: true},
      include: [
        {
          model: Role,
          as: "role",
        },
      ],
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError("Invalid password", 401);
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role_id: user.role_id,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, ENV_VARIABLE.JWT_SECRET, {
      expiresIn: ENV_VARIABLE.JWT_TOKEN_EXPIRATION,
    });

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      contact_number: user.contact_number,
      role_id: user.role_id,
      role_name: user.role.role_name,
    };

    return sendSuccessResponse(
      res,
      {
        token: token,
        user: userResponse,
      },
      "User logged in successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(
      res,
      [],
      error.message || "Error to login user",
      error.statusCode || 500
    );
  }
};

const verifyOTP = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const schema = Joi.object({
      otp: Joi.string().required(),
      email: Joi.string().email().required().lowercase(),
    });

    const value = validateSchema(schema, req.body);

    const existingUser = await authService.findUser({
      where: { email: value.email, is_active: true },
    });

    if (!existingUser) {
      throw new ApiError("User not found", 404);
    }

    // Verify OTP
    const isVerified = await authService.verifyOTP(
      existingUser.id,
      value.otp,
      transaction
    );

    if (!isVerified) {
      throw new ApiError("Invalid OTP", 400);
    }

    // Update user is_verified to true
    await authService.updateUserById(
      existingUser.id,
      { is_verified: true },
      transaction
    );

    await transaction.commit();

    return sendSuccessResponse(
      res,
      existingUser,
      "OTP verified successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(
      res,
      [],
      error.message || "Error to verify OTP",
      error.statusCode || 500
    );
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await authService.findUser({
      where: { id: req.user.id },
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          as: "role",
        },
      ],
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    const trancationHistory = await paymentService.findAllTransaction({
      where: { user_id: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    return sendSuccessResponse(
      res,
      {
        user,
        trancationHistory,
      },
      "Profile fetched successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(
      res,
      [],
      error.message || "Error to get profile",
      error.statusCode || 500
    );
  }
};

const updateProfile = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const schema = Joi.object({
      username: Joi.string()
        .pattern(/^[A-Za-z0-9]+$/)
        .message("Username can only contain letters (a-z) and numbers")
        .min(8)
        .lowercase()
        .trim()
        .optional(),
      contact_number: Joi.string().optional(),
    });

    const value = validateSchema(schema, req.body);

    if (value.username) {
      value.username = value.username.trim().toLowerCase();
      const existingUser = await authService.findUser({
        where: {
          username: value.username,
          id: { [Op.ne]: req.user.id },
        },
      });

      if (existingUser) {
        throw new ApiError("Username already exists", 400);
      }
    }

    const user = await authService.updateUserById(
      req.user.id,
      value,
      transaction
    );

    await transaction.commit();
    return sendSuccessResponse(res, user, "Profile updated successfully", 200);
  } catch (error) {
    await transaction.rollback();
    return sendErrorResponse(
      res,
      [],
      error.message || "Error to update profile",
      error.statusCode || 500
    );
  }
};

const changePassword = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const schema = Joi.object({
      old_password: Joi.string().required(),
      new_password: Joi.string().min(8).required(),
    });

    const value = validateSchema(schema, req.body);

    const existingUser = await authService.findUser({
      where: { id: req.user.id },
    });

    if (!existingUser) {
      throw new ApiError("User not found", 404);
    }

    const isPasswordValid = await comparePassword(
      value.old_password,
      existingUser.password
    );

    if (!isPasswordValid) {
      throw new ApiError("Invalid password", 401);
    }

    const hashedPassword = await generatehashPassword(value.new_password);
    await authService.updateUserById(
      existingUser.id,
      { password: hashedPassword },
      transaction
    );

    await transaction.commit();
    return sendSuccessResponse(res, [], "Password changed successfully", 200);
  } catch (error) {
    await transaction.rollback();
    return sendErrorResponse(
      res,
      [],
      error.message || "Error to change password",
      error.statusCode || 500
    );
  }
};

module.exports = {
  register,
  login,
  verifyOTP,
  getProfile,
  updateProfile,
  changePassword,
};
