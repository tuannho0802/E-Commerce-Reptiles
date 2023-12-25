import express from "express";
import Product from "../models/productModel.js";
// import data from "../data.js";
import User from "../models/userModel.js";

const seedRouter = express.Router();
// get data and send to FE
seedRouter.get("/", async (req, res) => {
  //get for product
  await Product.deleteMany({});
  const createdProducts = await Product.insertMany(data.products);

  //get for user
  await User.deleteMany({});
  const createdUsers = await User.insertMany(data.users);

  res.send({ createdProducts, createdUsers });
});

export default seedRouter;
