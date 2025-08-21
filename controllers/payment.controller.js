const { paymentService } = require("../services");
const { deleteImage } = require("../utils/multer.util");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/response.util");
const { ApiError } = require("../utils/apiError.util");
const { validateSchema } = require("../utils/validator.util");
const Joi = require("joi");
const { authService } = require("../services");
const { sequelize } = require("../config/database");

const uploadImage = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      throw new ApiError("No image file uploaded", 400);
    }

    const value = {
      image_url: req.file.filename,
      original_name: req.file.originalname,
      created_by: req.user.id,
      updated_by: req.user.id,
    };

    const result = await paymentService.storeImage(value);

    return sendSuccessResponse(res, result, "Image uploaded successfully", 201);
  } catch (error) {
    if (req.file) {
      await deleteImage(req.file.path);
    }
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to upload image",
      500
    );
  }
};

const getImage = async (req, res) => {
  try {
    const images = await paymentService.getImage();

    return sendSuccessResponse(
      res,
      images,
      "Images retrieved successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to retrieve images",
      500
    );
  }
};

const deposit = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const schema = Joi.object({
      amount: Joi.number().required(),
    });
    const value = validateSchema(schema, req.body);

    const user = await authService.findUser({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }
    value.user_id = user.id;
    value.type = "deposit";
    value.status = "pending";

    const result = await paymentService.createTransaction(value, transaction);

    await transaction.commit();
    return sendSuccessResponse(res, result, "Deposit successful", 200);
  } catch (error) {
    await transaction.rollback();
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to deposit",
      500
    );
  }
};

const withdraw = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const schema = Joi.object({
      amount: Joi.number().required(),
    });
    const value = validateSchema(schema, req.body);

    const user = await authService.findUser({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    if (user.balance < value.amount) {
      throw new ApiError("Insufficient balance", 400);
    }

    // check not any trancation pending
    const pendingTransaction = await paymentService.findTransaction({
      where: {
        user_id: user.id,
        status: "pending",
      },
    });
    if (pendingTransaction) {
      throw new ApiError("You have a pending transaction", 400);
    }

    value.user_id = user.id;
    value.type = "withdraw";
    value.status = "pending";

    const result = await paymentService.createTransaction(value, transaction);

    await transaction.commit();
    return sendSuccessResponse(res, result, "Withdrawal successful", 200);
  } catch (error) {
    await transaction.rollback();
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to withdraw",
      500
    );
  }
};

const approveTransaction = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const transactionRecord = await paymentService.findTransaction({
      where: {
        id: req.params.id,
      },
    });

    if (!transactionRecord) {
      throw new ApiError("Transaction not found", 404);
    }

    if (transactionRecord.status !== "pending") {
      throw new ApiError("Transaction not pending", 400);
    }

    const user = await authService.findUser({
      where: {
        id: transactionRecord.user_id,
      },
    });

    if (transactionRecord.type === "deposit") {
      user.balance =
        parseFloat(user.balance) + parseFloat(transactionRecord.amount);
      await authService.updateUserById(
        user.id,
        { balance: user.balance },
        transaction
      );
    }

    if (transactionRecord.type === "withdraw") {
      // check balance is enough
      if (user.balance < transactionRecord.amount) {
        throw new ApiError("Insufficient balance", 400);
      }
      user.balance =
        parseFloat(user.balance) - parseFloat(transactionRecord.amount);
      await authService.updateUserById(
        user.id,
        { balance: user.balance },
        transaction
      );
    }

    await paymentService.updateTransactionById(
      transactionRecord.id,
      { status: "approved" },
      transaction
    );

    await transaction.commit();
    return sendSuccessResponse(
      res,
      transactionRecord,
      "Transaction approved",
      200
    );
  } catch (error) {
    await transaction.rollback();
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to approve transaction",
      500
    );
  }
};

const rejectTransaction = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const transactionRecord = await paymentService.findTransaction({
      where: {
        id: req.params.id,
      },
    });

    if (!transactionRecord) {
      throw new ApiError("Transaction not found", 404);
    }

    if (transactionRecord.status !== "pending") {
      throw new ApiError("Transaction not pending", 400);
    }

    await paymentService.updateTransactionById(
      transactionRecord.id,
      { status: "rejected" },
      transaction
    );

    await transaction.commit();
    return sendSuccessResponse(
      res,
      transactionRecord,
      "Transaction rejected",
      200
    );
  } catch (error) {
    await transaction.rollback();
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to reject transaction",
      500
    );
  }
};

const depositHistory = async (req, res) => {
  try {
    const {
      page = 1,
      rows = 10,
      pagination = "true",
      status = "pending",
    } = req.query;

    const paginationOptions =
      pagination == "true"
        ? {
            limit: rows,
            offset: (page - 1) * rows,
          }
        : {};

    const transactionRecords = await paymentService.findAllTransaction({
      where: {
        type: "deposit",
        status: status,
      },
      ...paginationOptions,
      order: [["updatedAt", "DESC"]],
    });

    const totalRows = await paymentService.countTransaction({
      where: {
        type: "deposit",
        status: status,
      },
    });

    return sendSuccessResponse(
      res,
      { transactionRecords, totalCount: totalRows },
      "Deposit history",
      200
    );
  } catch (error) {
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to get deposit history",
      500
    );
  }
};

const withdrawHistory = async (req, res) => {
  try {
    const {
      page = 1,
      rows = 10,
      pagination = "true",
      status = "pending",
    } = req.query;

    const paginationOptions =
      pagination == "true"
        ? {
            limit: rows,
            offset: (page - 1) * rows,
          }
        : {};

    const transactionRecords = await paymentService.findAllTransaction({
      where: {
        type: "withdraw",
        status: status,
      },
      ...paginationOptions,
      order: [["updatedAt", "DESC"]],
    });

    const totalRows = await paymentService.countTransaction({
      where: {
        type: "withdraw",
        status: status,
      },
    });

    return sendSuccessResponse(
      res,
      { transactionRecords, totalCount: totalRows },
      "Withdraw history",
      200
    );
  } catch (error) {
    return sendErrorResponse(
      res,
      [],
      error.message || "Failed to get withdraw history",
      500
    );
  }
};

module.exports = {
  uploadImage,
  getImage,
  deposit,
  withdraw,
  approveTransaction,
  rejectTransaction,
  depositHistory,
  withdrawHistory,
};
