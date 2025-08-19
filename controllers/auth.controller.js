const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { db } = require("../config/database");
const { Role } = db;
const authService = require("../services/auth.service");
const { ROLE } = require("../constants/rolePermission.constant");
const { ENV_VARIABLE } = require("../constants/envVariable.constant");
const { validateSchema } = require("../utils/validator.util");
const { generatehashPassword, comparePassword } = require("../utils/hash.util");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/response.util");
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const schema = Joi.object({
      username: Joi.string().required(),
      email: Joi.string().email().required(),
      contact_number: Joi.string().allow(null).optional(),
      password: Joi.string().min(8).required(),
    });

    const { error, value } = validateSchema(schema, req.body);

    if (error) {
      return sendErrorResponse(res, [], error.details[0].message, 400);
    }

    const hashedPassword = await generatehashPassword(value.password);

    // get user role id
    const userRole = await authService.findRole({
      where: { role_name: ROLE.USER },
    });

    const user = await authService.registerUser(
      {
        ...value,
        password: hashedPassword,
        role_id: userRole.id,
      },
      transaction
    );

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
      500
    );
  }
};

const login = async (req, res) => {
  try {
    // Validate request body using common validation utility
    const schema = Joi.object({
      username: Joi.string().required(),
      password: Joi.string().min(8).required(),
    });

    const { error, value } = validateSchema(schema, req.body);

    if (error) {
      return sendErrorResponse(res, [], error.details[0].message, 400);
    }

    const { username, password } = value;

    // Find user by username
    const user = await authService.findUser({
      where: { username: username },
      include: [
        {
          model: Role,
          as: "role",
        },
      ],
    });

    if (!user) {
      return sendErrorResponse(res, [], "User not found", 404);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return sendErrorResponse(res, [], "Invalid password", 401);
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
      500
    );
  }
};

module.exports = {
  register,
  login,
};
