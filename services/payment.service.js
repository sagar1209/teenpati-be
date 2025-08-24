const { db } = require("../config/database");
const { ENV_VARIABLE } = require("../constants/envVariable.constant");
const { PaymentImage, TransactionHistory } = db;
const { deleteImage } = require("../utils/multer.util");

const storeImage = async (value) => {
  const image = await PaymentImage.findOne({});
  
  if(image){
    await deleteImage(`${process.cwd()}/images/payment/${image.image_url}`);
  }
  await PaymentImage.destroy({
    where: {},
    force: true,
  });
  
  const result = await PaymentImage.create(value);
  return result;
};

const getImage = async () => {
  const result = await PaymentImage.findOne({
    attributes: ["id", "image_url", "original_name"],
    order: [["createdAt", "DESC"]],
  });

  // creawte proper url
  const url = `${ENV_VARIABLE.BACKEND_URL}/api/images/payment/${result.image_url}`;
  result.image_url = url;
  return result;
};

const createTransaction = async (value, transaction) => {
  const result = await TransactionHistory.create(value, { transaction });
  return result;
};

const findTransaction = async (query) => {
  const result = await TransactionHistory.findOne(query);
  return result;
};

const updateTransactionById = async (id, value, transaction) => {
  const result = await TransactionHistory.update(value, {
    where: { id },
    transaction,
  });
  return result;
};

const findAllTransaction = async (query) => {
  const result = await TransactionHistory.findAll(query);
  return result;
};

const countTransaction = async (query) => {
  const result = await TransactionHistory.count(query);
  return result;
};  

module.exports = {
  storeImage,
  getImage,
  createTransaction,
  findTransaction,
  updateTransactionById,
  findAllTransaction,
  countTransaction,
};
