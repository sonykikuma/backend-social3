const uploadRoute = require("express").Router();
const cloudinary = require("cloudinary").v2; // Use .v2 if using Cloudinary v2
const multer = require("multer");
const path = require("path");
const verifyToken = require("../middlewares/verifyToken");

//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage({
  //diskStorage

  destination: (req, file, cb) => {
    //here cb is callback
    //cb(null, "public/images");
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    //cb(null, req.body.filename);
    cb(null, Date.now() + "-" + file.originalname); // unique filename
  },
});

const upload = multer({
  storage: storage,
});

uploadRoute.post(
  "/image",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log(req.file);
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "uploads" },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        stream.end(req.file.buffer); // Use file buffer for streaming upload
      });

      res.json({ imageUrl: result.secure_url });

      // const result = await cloudinary.uploader.upload(req.file.path, {
      //   folder: "uploads", //folder_name
      // });
      // res.json({ imageUrl: result.secure_url });

      //return res.status(200).json({ msg: "image successfully uploaded" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error uploading image to Cloudinary" });
    }
  }
);

module.exports = uploadRoute;
