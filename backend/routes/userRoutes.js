import express from "express";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { generateToken, isAuth, isAdmin, baseUrl } from "../utils.js";
import expressAsyncHandler from "express-async-handler";

const userRouter = express.Router();

// Get all users (Admin only)
userRouter.get(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});
    res.send(users);
  })
);

// Sign in user
userRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    // Find user by email
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      // Check if the provided password matches the stored hashed password
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isAdmin: user.isAdmin,
          token: generateToken(user),
        });
        return;
      }
    }

    // If email or password is invalid, return 401 Unauthorized
    res.status(401).send({ message: "Invalid email or password" });
  })
);

// Get user information for editing (Admin only)
userRouter.get(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      res.send(user);
    } else {
      res.status(404).send({ message: "User Not Found" });
    }
  })
);

// Delete user (Admin only)
userRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      // Check if it's the true admin user
      if (user.email === "hoangtuanft0802@gmail.com") {
        res.status(400).send({ message: "Cannot Delete True Admin User" });
        return;
      }

      // Delete the user
      await user.deleteOne();
      res.send({ message: "User Deleted" });
    } else {
      res.status(404).send({ message: "User Not Found" });
    }
  })
);

// Update user account information
// this needs to be above //put user info to edit api
userRouter.put(
  "/profile",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
      // Update user fields based on the provided data
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.avatar = req.body.avatar !== null ? req.body.avatar : null;

      // If a new password is provided, hash and update the password
      if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, 8);
      }

      // Save the updated user
      const updatedUser = await user.save();
      res.send({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        avatar: updatedUser.avatar,
        token: generateToken(updatedUser),
      });
    } else {
      res.status(404).send({ message: "User not found" });
    }
  })
);

// Request to reset password (Send reset link to user's email)
userRouter.post(
  "/forget-password",
  expressAsyncHandler(async (req, res) => {
    // Find user by email
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      // Generate a reset token and save it to the user
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "3h",
      });
      user.resetToken = token;
      await user.save();

      console.log(`${baseUrl()}/reset-password/${token}`);

      // Send reset link to user's email
      const transport = nodemailer.createTransport({
        // Configure email service provider details
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.USER,
          pass: process.env.APP_PASSWORD,
        },
      });

      transport.verify(function (error, success) {
        if (error) {
          console.log(error);
        } else {
          console.log("Server is ready to take our messages");
        }
      });

      const mailOptions = {
        from: {
          name: "Reptiles Shop - COMP1682",
        },
        to: `${user.name} <${user.email}>`,
        subject: `Reset Password`,
        text: "We have sent you a reset password confirm email",
        html: ` 
        <p>Please Click the following link to reset your password:</p> 
        <a href="${baseUrl()}/reset-password/${token}"}>Reset Password</a>
        `,
      };

      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
        } else {
          console.log(`Email sent: ${info.response}`);
        }
      });

      res.send({ message: "Reset Password is sent" });
    } else {
      res.status(404).send({ message: "User Not Found" });
    }
  })
);

// Reset password based on the provided token
userRouter.post(
  "/reset-password",
  expressAsyncHandler(async (req, res) => {
    // Verify the provided token
    jwt.verify(req.body.token, process.env.JWT_SECRET, async (err, decode) => {
      if (err) {
        res.status(401).send({ message: "Invalid Token" });
      } else {
        // Find user by reset token
        const user = await User.findOne({ resetToken: req.body.token });

        if (user) {
          // If a new password is provided, hash and update the password
          if (req.body.password) {
            user.password = bcrypt.hashSync(req.body.password, 8);
            await user.save();
            res.send({
              message: "Password reseted successfully",
            });
          }
        } else {
          res.status(404).send({ message: "User not found" });
        }
      }
    });
  })
);

// Update user information (Admin only)
userRouter.put(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      // Update user fields based on the provided data
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.avatar = req.body.avatar || user.avatar;
      user.isAdmin = Boolean(req.body.isAdmin);

      // Save the updated user
      const updatedUser = await user.save();
      res.send({ message: "User Updated", user: updatedUser });
    } else {
      res.status(404).send({ message: "User Not Found" });
    }
  })
);

// Sign up new user
userRouter.post(
  "/signup",
  expressAsyncHandler(async (req, res) => {
    // Create a new user
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      avatar: "/images/default1.jpg",
      password: bcrypt.hashSync(req.body.password),
    });

    // Save the new user
    const user = await newUser.save();

    // Send the user information in the response
    res.send({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: "/images/default1.jpg",
      token: generateToken(user),
    });
  })
);

export default userRouter;
