import mongoose from "mongoose";

// Define the comment schema for comments within a post
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model, indicating that this field stores user IDs
      required: true,
    },
    comment: { type: String, required: true },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

// Define the post schema for forum posts
const postSchema = new mongoose.Schema(
  {
    title: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String },
    img: { type: String },
    imgs: [String],
    comments: [commentSchema],
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    dislikes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Reference to the User model, indicating that this field stores user IDs
        },
      },
    ],
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

// Create the Forum model using the postSchema
const Forum = mongoose.model("Forum", postSchema);

export default Forum;
