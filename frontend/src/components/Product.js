import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import "./css/Product.css";
import Rating from "./Rating";
import axios from "axios";
import { Store } from "../Store";

function Product(props) {
  const { product } = props;
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    cart: { cartItems },
  } = state;

  const [loading, setLoading] = useState(true);

  //delayed loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const addToCartHandler = async (item) => {
    const existItem = cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`api/products/${item._id}`);
    if (data.countInStock < quantity) {
      // Check quantity
      window.alert("Product is out of stock");
      return;
    }

    ctxDispatch({
      type: "CART_ADD_ITEM",
      payload: { ...item, quantity },
    });
  };

  return (
    <div style={{ paddingRight: "2vw", paddingTop: "2vw" }}>
      {loading ? (
        <div className="loading-box" />
      ) : (
        <Card className="mb-3 card-container appear-animation">
          <Link to={`/product/${product.slug}`}>
            <img
              style={{ maxWidth: "100%" }}
              src={product.img}
              className="product-size"
              alt={product.name}
            />
          </Link>
          <Card.Body>
            <Link to={`/product/${product.slug}`}>
              <Card.Title>
                <p className="product-title">{product.name}</p>
              </Card.Title>
            </Link>

            <Rating rating={product.rating} numReviews={product.numReviews} />
            <Card.Text>
              <strong>Type: {product.category}</strong>
            </Card.Text>
            <Card.Text>
              <strong>Sold: {product.sold}</strong>
            </Card.Text>
            <Card.Text>
              <strong>${product.price}</strong>
            </Card.Text>
            {product.countInStock === 0 ? (
              <Button
                style={{
                  borderColor: "black",
                  fontSize: "large",
                  borderRadius: "10px",
                }}
                variant="light"
                disabled
              >
                Out of Stock
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={() => addToCartHandler(product)}
              >
                <div className="fas fa-cart-plus"></div> Add to Cart
              </Button>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

export default Product;
