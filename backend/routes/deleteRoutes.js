import express from "express";
import cloudinary from "cloudinary";
import { isAuth } from "../utils.js";

const deleteRouter = express.Router();

// DELETE endpoint for handling file deletion
deleteRouter.delete("/:public_id", isAuth, async (req, res) => {
  try {
    // Configure Cloudinary with API credentials
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Public ID of the file to be deleted, passed as a parameter in the URL
    const public_id = req.params.public_id;

    // Use the Cloudinary API to delete the specified file
    const result = await cloudinary.uploader.destroy(public_id);

    console.log(result);

    // Check if the deletion was successful
    if (result.result === "ok") {
      res.send({ message: "File deleted successfully" });
    } else {
      res.status(500).send({ message: "File deletion failed" });
    }
  } catch (error) {
    // Handle any errors that occurred during the file deletion
    res
      .status(500)
      .send({ message: "File deletion failed", error: error.message });
  }
});

export default deleteRouter;
