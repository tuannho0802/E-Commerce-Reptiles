import express from "express";
import Product from "../models/productModel.js";
import expressAsyncHandler from "express-async-handler";
import { isAdmin, isAuth } from "../utils.js";

const productRouter = express.Router();

// Get all products API
productRouter.get("/", async (req, res) => {
  const products = await Product.find();
  res.send(
    products.map((product) => ({
      ...product._doc,
      sold: product.sold,
      img: product.img,
    }))
  );
});

// Create a new product API
productRouter.post(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newProduct = new Product({
      name: "sample name " + Date.now(),
      slug: "sample-name-" + Date.now(),
      img: "https://res.cloudinary.com/personal-media-cloud/image/upload/v1703479952/gqzh5bxjfi9fwdylth2q.jpg",
      price: 0,
      category: "sample category",
      country: "sample country",
      countInStock: 0,
      rating: 0,
      numReviews: 0,
      description: "sample description",
    });
    const product = await newProduct.save();
    res.send({ message: "Product Created", product });
  })
);

// Update product details API
productRouter.put(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (product) {
      // Update product details
      product.name = req.body.name;
      product.slug = req.body.slug;
      product.price = req.body.price;
      product.img = req.body.img;
      product.imgs = req.body.imgs;
      product.category = req.body.category;
      product.country = req.body.country;
      product.countInStock = req.body.countInStock;
      product.description = req.body.description;
      await product.save();

      res.send({ message: "Product Updated" });
    } else {
      res.status(404).send({ message: "Product Not Found" });
      //check the product
      if (product) {
        await product.remove();
        res.send({ message: "Product Deleted" });
      } else {
        res.status(404).send({ message: "Product Not Found" });
      }
    }
  })
);

// Delete a product API
productRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.send({ message: "Product Deleted" });
    } else {
      res.status(404).send({ message: "Product Not Found" });
    }
  })
);

// Create a review for a product API
productRouter.post(
  "/:id/reviews",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    // Get the productId from url
    const productId = req.params.id;
    const product = await Product.findById(productId);

    // Check if the user has already submitted a review for this product
    if (product) {
      if (product.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: "You already submitted a review for this product" });
      }

      // Create a review object
      const review = {
        name: req.user.name,
        avatar: req.user.avatar,
        rating: Number(req.body.rating),
        comment: req.body.comment,
        isAdmin: req.user.isAdmin,
        user: req.user._id,
      };
      product.reviews.push(review); //push the review object

      // Update the numReviews and rating fields
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((a, c) => c.rating + a, 0) /
        product.reviews.length;

      const updatedProduct = await product.save(); //save the updated product
      res.status(201).send({
        message: "Review submitted successfully!",
        review: updatedProduct.reviews[updatedProduct.reviews.length - 1],
        numReviews: product.numReviews,
        rating: product.rating,
      });
    } else {
      res.status(404).send({ message: "Product Not Found" });
    }
  })
);

// Delete a product review
productRouter.delete(
  "/:id/reviews/:reviewId",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const reviewId = req.params.reviewId;

    const product = await Product.findById(productId);

    const reviewIndex = product.reviews.findIndex((r) => r._id == reviewId);

    if (reviewIndex === -1) {
      res.status(404).send({ message: "Review not found" });
      return;
    }

    const deletedReview = product.reviews.splice(reviewIndex, 1)[0];

    // If product.rating is a single value, handle it differently
    if (typeof product.rating === "number") {
      // Handle the case where product.rating is a single value
      product.rating = calculateAverageRating(product.reviews);
    } else {
      // Remove the corresponding rating from the product's ratings array
      const deletedRatingId = deletedReview.rating; // Assuming the rating ID is stored in the 'rating' field of the review
      product.rating = product.rating.filter((r) => r._id != deletedRatingId);
    }

    // Update numReviews field
    product.numReviews = product.reviews.length;

    await product.save();

    res.send({ message: "Review deleted successfully", product });
  })
);

// Update a product review
productRouter.put(
  "/:id/reviews/:reviewId",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const reviewId = req.params.reviewId;

    const product = await Product.findById(productId);

    const review = product.reviews.find((r) => r._id == reviewId);

    if (!review) {
      res.status(404).send({ message: "Review not found" });
      return;
    }

    // Check if the user editing the review is the same user who created it
    if (review.user.toString() !== req.user._id.toString()) {
      res
        .status(401)
        .send({ message: "You are not authorized to edit this review" });
      return;
    }

    // Update review properties
    review.rating = Number(req.body.rating);
    review.comment = req.body.comment;

    // Update the product's overall rating if needed
    product.rating = calculateAverageRating(product.reviews);

    // Save the updated product
    await product.save();

    res.send({
      message: "Review updated successfully",
      review,
      numReviews: product.numReviews,
      rating: product.rating,
    });
  })
);

// Function to calculate average rating
function calculateAverageRating(reviews) {
  if (reviews.length === 0) {
    return 0;
  }

  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}

// Get the list of products for admin (pagination)
const PAGE_SIZE = 9;
productRouter.get(
  "/admin",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const products = await Product.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countProducts = await Product.countDocuments();
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

// Search for products based on various filters
productRouter.get(
  "/search",
  expressAsyncHandler(async (req, res) => {
    // Extract query parameters from the request
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || "";
    const price = query.price || "";
    const rating = query.rating || "";
    const order = query.order || "";
    const country = query.country || "";
    const searchQuery = query.query || "";

    // Define filters based on query parameters
    const queryFilter =
      searchQuery && searchQuery !== "all"
        ? {
            name: {
              $regex: searchQuery,
              $options: "i",
            },
          }
        : {};
    const categoryFilter = category && category !== "all" ? { category } : {};
    const countryFilter = country && country !== "all" ? { country } : {};

    const ratingFilter =
      rating && rating !== "all"
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};
    const priceFilter =
      price && price !== "all"
        ? {
            // Parse and filter products based on price range
            price: {
              $gte: Number(price.split("-")[0]),
              $lte: Number(price.split("-")[1]),
            },
          }
        : {};

    // Define the sorting order for the retrieved products
    const sortOrder =
      order === "featured"
        ? { featured: -1 }
        : order === "lowest"
        ? { price: 1 }
        : order === "highest"
        ? { price: -1 }
        : order === "toprated"
        ? { rating: -1 }
        : order === "newest"
        ? { createdAt: -1 }
        : { _id: -1 };

    // Query the database to retrieve products based on filters and sorting order
    const products = await Product.find({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
      ...countryFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    // Count the total number of products based on the filters
    const countProducts = await Product.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
      ...countryFilter,
    });

    // Send the response with the retrieved products, count, and pagination information
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

// Get product categories
productRouter.get(
  "/categories",
  expressAsyncHandler(async (req, res) => {
    const categories = await Product.find().distinct("category");
    res.send(categories);
  })
);

// Get product countries
productRouter.get(
  "/countries",
  expressAsyncHandler(async (req, res) => {
    const countries = await Product.find().distinct("country");
    res.send(countries);
  })
);

// Get product details by slug
productRouter.get("/slug/:slug", async (req, res) => {
  const product = await Product.findOne({ slug: { $eq: req.params.slug } })
    .populate({
      path: "reviews.user",
      model: "User",
      select: "_id name avatar isAdmin",
    })
    .exec();

  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: "Product not found" });
  }
});

// Get product details by ID
productRouter.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: "Product not found" });
  }
});

// Get related products by product ID
productRouter.get(
  "/:id/related",
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Find related products based on category
      const relatedProducts = await Product.find({
        category: product.category,
        _id: { $ne: product._id }, // Exclude the current product
      }).limit(3); // Adjust the limit as per requirement

      res.send(relatedProducts);
    } else {
      res.status(404).send({ message: "Product not found" });
    }
  })
);

export default productRouter;
