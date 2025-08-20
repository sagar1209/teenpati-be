const { sendErrorResponse } = require("../utils/response.util");
const { ApiError } = require("../utils/apiError.util");
const { ROLE } = require("../constants/rolePermission.constant");

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError("Authentication required", 401);
    }

    if (!req.user.role || req.user.role.role_name !== ROLE.SUPER_ADMIN) {
      throw new ApiError("Admin access required", 403);
    }

    next();
  } catch (error) {
    return sendErrorResponse(res, [], error.message, error.statusCode || 500);
  }
};

const isUser = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError("Authentication required", 401);
    }

    if (!req.user.role || req.user.role.role_name !== ROLE.USER) {
      throw new ApiError("User access required", 403);
    }

    next();
  } catch (error) {
    return sendErrorResponse(res, [], error.message, error.statusCode || 500);
  }
};

module.exports = {
  isAdmin,
  isUser,
};
