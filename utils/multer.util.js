const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");

function createSingleImageUpload(options = {}) {
  const {
    uploadPath = 'images',
    maxSize = 5 * 1024 * 1024 // 5MB default
  } = options;

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "../images", uploadPath);
      fs.ensureDir(dir, (err) => {
        if (err) {
          console.error(`Failed to create directory ${dir}:`, err);
          return cb(err);
        }
        console.log(`Uploading image to directory: ${dir}`);
        cb(null, dir);
      });
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const filename = `image_${timestamp}${extension}`;
      console.log(`Saving image as: ${filename}`);
      cb(null, filename);
    },
  });

  const fileFilter = (req, file, cb) => {
    // Only allow JPG and JPEG files
    const allowedTypes = ['image/jpeg', 'image/jpg'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(`Invalid file type. Only JPG and JPEG files are allowed. Received: ${file.mimetype}`),
        false
      );
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
    },
  }).single('image');

  return upload;
}

function multerErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    console.error(`Multer error: ${err.message}`);
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  if (err) {
    console.error(`Upload error: ${err.message}`);
    return res.status(400).json({ error: err.message || "File upload failed" });
  }
  console.log("File upload successful, proceeding to next middleware");
  next();
}

async function deleteImage(filePath) {
    try {
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      throw error;
    }
  }

module.exports = {
  createSingleImageUpload,
  multerErrorHandler,
  deleteImage
};
