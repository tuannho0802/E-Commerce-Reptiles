import React, { useEffect, useReducer, useState } from "react";
import axios from "axios";
import logger from "use-reducer-logger";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Product from "../components/Product";
import { Helmet } from "react-helmet-async";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

// Reducer function to manage state during data fetching
const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, products: action.payload, loading: false };
    case "FETCH_FAILED":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

// Constant for the number of items per page
const itemsPerPage = 6;

function HomeScreen() {
  // State for the current page number
  const [currentPage, setCurrentPage] = useState(
    parseInt(localStorage.getItem("currentPage")) || 1
  );

  // State for the initial sort option, retrieved from localStorage
  const initialSortOption = localStorage.getItem("sortOption") || "reviews";
  const [sortOption, setSortOption] = useState(initialSortOption);

  // State managed by the reducer for loading, error, and product data
  const [{ loading, error, products }, dispatch] = useReducer(logger(reducer), {
    products: [],
    loading: true,
    error: "",
  });

  // Effect to fetch data when the sort option changes
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: "FETCH_REQUEST" });
      try {
        const result = await axios.get("/api/products");
        const filteredProducts = result.data.filter(
          (product) => product.countInStock > 0
        );

        let sortedProducts;

        if (sortOption === "reviews") {
          sortedProducts = filteredProducts.sort(
            (a, b) => b.reviews.length - a.reviews.length
          );
        } else if (sortOption === "sold") {
          sortedProducts = filteredProducts.sort((a, b) => b.sold - a.sold);
        } else {
          // No specific sorting (list all products)
          sortedProducts = filteredProducts;
        }

        dispatch({ type: "FETCH_SUCCESS", payload: sortedProducts });
      } catch (err) {
        dispatch({ type: "FETCH_FAILED", payload: err.message });
      }
    };

    fetchData();
  }, [sortOption]);

  // Effect to update localStorage when the current page changes
  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  // Effect to update localStorage when the sort option changes
  useEffect(() => {
    localStorage.setItem("sortOption", sortOption);
  }, [sortOption]);

  // Calculate indices for the current page's products
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = products.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Calculate total number of pages based on the number of products and items per page
  const totalPages = Math.ceil(products.length / itemsPerPage);

  // Function to handle pagination and scroll to the top of the page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ paddingTop: "20px" }}>
      <Helmet>
        <title>Reptiles</title>
      </Helmet>

      <div>
        {/* Conditionally render loading, error, or product data */}
        {loading ? (
          <div className="loading-box"></div>
        ) : error ? (
          <div className="error">
            {error}/
            <div>
              <a href="/">Homepage</a>
            </div>
          </div>
        ) : (
          <div>
            <h1>
              <div className="fas fa-store"></div> Feature Reptiles
            </h1>
            {/* Display the page title and sorting options */}
            <Form.Select
              aria-label="Sort By"
              value={sortOption}
              style={{ maxWidth: "12vw" }}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="reviews">Most Reviews</option>
              <option value="sold">Most Sold</option>
            </Form.Select>

            {/* Display the current page's products in a grid */}
            <Row>
              {currentProducts.map((product) => (
                <Col
                  key={product._id}
                  sm="auto"
                  md="auto"
                  lg={4}
                  className="mb-3"
                >
                  <Product product={product}></Product>
                </Col>
              ))}
            </Row>

            {/* Display pagination controls */}
            <div className="pagination-container">
              <Button
                className="m-1"
                variant="dark"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fas fa-arrow-alt-circle-left" />
              </Button>
              {Array.from({ length: totalPages }).map((_, index) => (
                <Button
                  className="m-1"
                  variant={currentPage === index + 1 ? "dark" : "outline-dark"}
                  key={index}
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </Button>
              ))}
              <Button
                className="m-1"
                variant="dark"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-arrow-alt-circle-right" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeScreen;
