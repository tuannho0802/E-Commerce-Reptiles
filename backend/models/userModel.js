import mongoose from "mongoose";

// Define the user schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    resetToken: { type: String },
    isAdmin: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

// Create the User model using the userSchema
const User = mongoose.model("User", userSchema);

export default User;
