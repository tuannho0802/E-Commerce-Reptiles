import express from "express";
import Forum from "../models/forumModel.js";
import expressAsyncHandler from "express-async-handler";
import { isAuth } from "../utils.js";

const forumRouter = express.Router();

// Get all posts
forumRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const posts = await Forum.find().populate("user");
    res.send(posts);
  })
);

// Create a new post
forumRouter.post(
  "/",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const newPost = new Forum({
      user: req.user._id,
      title: req.body.title || "Sample Post",
      text: req.body.text || "",
      img: req.body.img || "/images/test1.jpg",
      imgs: req.body.imgs || [],
      comments: [],
    });

    const createdPost = await newPost.save();

    // Use Mongoose 6 syntax for population
    const populatedPost = await Forum.populate(createdPost, {
      path: "user",
      select: "username email",
    });

    res.status(201).send({ message: "Post Created", post: populatedPost });
  })
);

// Get a specific post by ID
forumRouter.get(
  "/:postId",
  expressAsyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const post = await Forum.findById(postId)
      .populate({
        path: "user",
        select: "name avatar isAdmin", // Only select name and avatar from the user
      })
      .populate({
        path: "comments.user",
        select: "name avatar isAdmin", // Populate user information for each comment
      });

    if (post) {
      res.send(post);
    } else {
      res.status(404).send({ message: "Post Not Found" });
    }
  })
);

// Get postId for edit
forumRouter.get(
  "/edit/:postId",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const post = await Forum.findById(postId);

    if (post) {
      res.send(post);
    } else {
      res.status(404).send({ message: "Post Not Found" });
    }
  })
);

// Edit a specific post by ID
forumRouter.put(
  "/edit/:postId",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const post = await Forum.findById(postId);

    if (post) {
      post.title = req.body.title || post.title;
      post.text = req.body.text || post.text;
      post.img = req.body.img || post.img;
      post.imgs = req.body.imgs || post.imgs;

      const updatedPost = await post.save();

      // Use Mongoose 6 syntax for population
      const populatedPost = await Forum.populate(updatedPost, {
        path: "user",
        select: "username email",
      });

      res.send({ message: "Post Updated", post: populatedPost });
    } else {
      res.status(404).send({ message: "Post Not Found" });
    }
  })
);

// Delete a post by ID
forumRouter.delete(
  "/:postId",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const post = await Forum.findById(postId);
    if (post) {
      await post.deleteOne();
      res.send({ message: "Forum Deleted" });
    } else {
      res.status(404).send({ message: "Forum Not Found" });
    }
  })
);

// Add a comment to a post
forumRouter.post(
  "/:id/comments",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const postId = req.params.id;
    const post = await Forum.findById(postId);

    if (post) {
      const comment = {
        name: req.user.name,
        avatar: req.user.avatar,
        comment: req.body.comment,
        user: req.user._id,
      };

      post.comments.push(comment);
      await post.save();

      res
        .status(201)
        .send({ message: "Comment Successfully", comment: comment });
    } else {
      res.status(404).send({ message: "Post Not Found" });
    }
  })
);

// Delete a comment from a post
forumRouter.delete(
  "/:postId/comments/:commentId",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    const post = await Forum.findById(postId);

    if (post) {
      const commentIndex = post.comments.findIndex(
        (c) => c._id.toString() === commentId
      );

      if (commentIndex === -1) {
        res.status(404).send({ message: "Comment not found" });
        return;
      }

      const deletedComment = post.comments.splice(commentIndex, 1)[0];
      await post.save();

      res.send({
        message: "Comment deleted successfully",
        comment: deletedComment,
      });
    } else {
      res.status(404).send({ message: "Post Not Found" });
    }
  })
);

// Edit a comment on a post
forumRouter.put(
  "/:postId/comments/:commentId",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    const post = await Forum.findById(postId);

    if (post) {
      const commentIndex = post.comments.findIndex(
        (c) => c._id.toString() === commentId
      );

      if (commentIndex === -1) {
        res.status(404).send({ message: "Comment not found" });
        return;
      }

      const existingComment = post.comments[commentIndex];

      // Check if the user editing the comment is the same user who created it
      if (existingComment.user.toString() !== req.user._id.toString()) {
        res
          .status(401)
          .send({ message: "You are not authorized to edit this comment" });
        return;
      }

      // Update comment properties
      existingComment.comment = req.body.comment || existingComment.comment;

      await post.save();

      res.send({
        message: "Comment updated successfully",
        comment: existingComment,
      });
    } else {
      res.status(404).send({ message: "Post Not Found" });
    }
  })
);

// Toggle Like
forumRouter.post(
  "/:postId/toggle-like",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const post = await Forum.findById(postId);

    if (post) {
      const likedIndex = post.likes.findIndex(
        (like) => like.user.toString() === req.user._id.toString()
      );

      if (likedIndex !== -1) {
        // If user has already liked, remove the like
        post.likes.splice(likedIndex, 1);
        post.likesCount -= 1; // Decrement likes count
      } else {
        // If user has not liked, toggle to like and remove dislike
        post.likes.push({ user: req.user._id });
        post.likesCount += 1; // Increment likes count

        const dislikedIndex = post.dislikes.findIndex(
          (dislike) => dislike.user.toString() === req.user._id.toString()
        );
        if (dislikedIndex !== -1) {
          post.dislikes.splice(dislikedIndex, 1);
          post.dislikesCount -= 1; // Decrement dislikes count
        }
      }

      await post.save();
      res.send({ message: "Like toggled successfully" });
    } else {
      res.status(404).send({ message: "Post Not Found" });
    }
  })
);

// Toggle Dislike
forumRouter.post(
  "/:postId/toggle-dislike",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const postId = req.params.postId;
    const post = await Forum.findById(postId);

    if (post) {
      const dislikedIndex = post.dislikes.findIndex(
        (dislike) => dislike.user.toString() === req.user._id.toString()
      );

      if (dislikedIndex !== -1) {
        // If user has already disliked, remove the dislike
        post.dislikes.splice(dislikedIndex, 1);
        post.dislikesCount -= 1; // Decrement dislikes count
      } else {
        // If user has not disliked, toggle to dislike and remove like
        post.dislikes.push({ user: req.user._id });
        post.dislikesCount += 1; // Increment dislikes count

        const likedIndex = post.likes.findIndex(
          (like) => like.user.toString() === req.user._id.toString()
        );
        if (likedIndex !== -1) {
          post.likes.splice(likedIndex, 1);
          post.likesCount -= 1; // Decrement likes count
        }
      }

      await post.save();
      res.send({ message: "Dislike toggled successfully" });
    } else {
      res.status(404).send({ message: "Post Not Found" });
    }
  })
);

export default forumRouter;
