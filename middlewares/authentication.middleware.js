const jwt = require("jsonwebtoken");
const { sendErrorResponse } = require("../utils/response.util");
const { ENV_VARIABLE } = require("../constants/envVariable.constant");
const { authService } = require("../services");
const { ApiError } = require("../utils/apiError.util");
const { db } = require("../config/database");
const { Role } = db;

const auth = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      throw new ApiError("Token Not Found", 403);
    }
    let decoded;
    try {
      decoded = jwt.verify(token, ENV_VARIABLE.JWT_SECRET);
    } catch (error) {
      throw new ApiError("Invalid Token", 403);
    }

    const foundUser = await authService.findUser({
      where: {
        id: decoded.userId,
      },
      attributes: ["id", "email", "role_id", "balance", "username"],
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "role_name"],
        },
      ],
    });

    if (!foundUser) {
      throw new ApiError("User not found", 404);
    }

    req.user = foundUser;
    next();
  } catch (error) {
    return sendErrorResponse(res, [], error.message, error.statusCode || 500);
  }
};

module.exports = { auth };
