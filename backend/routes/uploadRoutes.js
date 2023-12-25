import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { isAuth } from "../utils.js";

// Create a multer instance for handling file uploads
const upload = multer();

// Create an instance of the Express Router
const uploadRouter = express.Router();

// POST endpoint for handling file uploads
uploadRouter.post(
  "/",
  isAuth, // Middleware to ensure user is authenticated
  upload.single("file"), // Use multer to handle a single file upload
  async (req, res) => {
    // Configure Cloudinary with API credentials
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Define a function to upload a file stream to Cloudinary
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        // Create a stream and pipe it to Cloudinary uploader
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result); // Resolve with the Cloudinary result
          } else {
            reject(error); // Reject with an error if upload fails
          }
        });

        // Pipe the file buffer from multer to the Cloudinary stream
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    try {
      // Upload the file to Cloudinary and get the result
      const result = await streamUpload(req);

      // Send the Cloudinary result as the response
      res.send(result);
    } catch (error) {
      // Handle any errors that occurred during the file upload
      res
        .status(500)
        .send({ message: "File upload failed", error: error.message });
    }
  }
);

// Export the uploadRouter for use in other parts of the application
export default uploadRouter;
