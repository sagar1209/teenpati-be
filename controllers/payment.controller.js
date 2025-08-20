const paymentService = require('../services/payment.service');
const { deleteImage } = require('../utils/multer.util');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response.util');


const uploadImage = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return sendErrorResponse(res, [], 'No image file uploaded', 400);
    }
    
    const value = {
      image_url: req.file.filename,
      original_name: req.file.originalname,
      created_by: 1,
      updated_by: 1,
    };

    const result = await paymentService.storeImage(value);
    
    return sendSuccessResponse(
      res,
      result,
      'Image uploaded successfully',
      201
    );
  } catch (error) {
    if(req.file){
      await deleteImage(req.file.path);
    }
    return sendErrorResponse(
      res,
      [],
      error.message || 'Failed to upload image',
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
      'Images retrieved successfully',
      200
    );
  } catch (error) {
    return sendErrorResponse(
      res,
      [],
      error.message || 'Failed to retrieve images',
      500
    );
  }
};

module.exports = {
  uploadImage,
  getImage
};
