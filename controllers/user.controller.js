const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { db } = require("../config/database");
const { Role } = db;
const { authService } = require("../services");
const { ROLE } = require("../constants/rolePermission.constant");
const { ENV_VARIABLE } = require("../constants/envVariable.constant");
const { validateSchema } = require("../utils/validator.util");
const { generatehashPassword, comparePassword } = require("../utils/hash.util");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/response.util");
const { ApiError } = require("../utils/apiError.util");
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
    return sendErrorResponse(res, error, "Failed to fetch users", 500);
  }
};

module.exports = {
  getAllUsers,
};
