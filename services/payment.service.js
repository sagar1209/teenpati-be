const { db } = require("../config/database");
const { ENV_VARIABLE } = require("../constants/envVariable.constant");
const { PaymentImage } = db;
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
  const url = `${ENV_VARIABLE.BASE_URL}/images/payment/${result.image_url}`;
  result.image_url = url;
  return result;
};

module.exports = {
  storeImage,
  getImage,
};
