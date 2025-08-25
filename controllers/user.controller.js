const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { db } = require("../config/database");
const { Role } = db;
const { authService } = require("../services");
const { ROLE } = require("../constants/rolePermission.constant");
const { ENV_VARIABLE } = require("../constants/envVariable.constant");
const { validateSchema } = require("../utils/validator.util");
const { sequelize } = require("../config/database");
const { generatehashPassword, comparePassword } = require("../utils/hash.util");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/response.util");
const { ApiError } = require("../utils/apiError.util");
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const updateUserById = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {

    const schema = Joi.object({
      is_active: Joi.boolean().optional(),
      balance: Joi.number().optional(),
    });
    const value = validateSchema(schema, req.body);
    const { id } = req.params;
    const user = await authService.findUser({
      where: { id },
    });
    if (!user) {
      throw new ApiError("User not found", 404);
    }
    await authService.updateUserById(id, value, transaction);
    await transaction.commit();
    return sendSuccessResponse(res, user, "User updated successfully", 200);
  } catch (error) {
    await transaction.rollback();
    return sendErrorResponse(res, error, "Failed to update user", error.statusCode || 500);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      rows = 10,
      search = "",
      pagination = "true",
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
      is_verified: true,
    };

    const users = await authService.findAllUsers({
      where,
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "role_name"],
          where: {
            role_name: ROLE.USER,
          },
        },
      ],
      attributes: {
        exclude: ["password", "createdAt", "updatedAt", "role_id"],
      },
      order: [[sort, order]],
      ...paginationOptions,
    });

    const totalRows = await authService.countUsers({
      where,
    });

    return sendSuccessResponse(
      res,
      {
        users,
        totalCount: totalRows,
      },
      "Users fetched successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(
      res,
      error,
      "Failed to fetch users",
      error.statusCode || 500
    );
  }
};

module.exports = {
  updateUserById,
  getAllUsers,
};
