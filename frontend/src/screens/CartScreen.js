import React, { useContext } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { Helmet } from "react-helmet-async";
import { Store } from "../Store";
import { Link, useNavigate } from "react-router-dom";
import "./css/CartScreen.css";
import axios from "axios";

export default function CartScreen() {
  // Access the navigation function for redirecting
  const navigate = useNavigate();

  // Access the global state and dispatch function using useContext
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    cart: { cartItems },
  } = state;

  // Function to update the cart item quantity
  const updateCartHandler = async (item, quantity) => {
    // Get product information from the backend
    const { data } = await axios.get(`api/products/${item._id}`);
    // Check if the requested quantity exceeds the available stock
    if (data.countInStock < quantity) {
      //check quantity
      window.alert("Product is out of stock");
      return;
    }

    // Dispatch an action to update the cart with the new quantity
    ctxDispatch({
      type: "CART_ADD_ITEM",
      payload: { ...item, quantity },
    });
  };

  // Function to remove an item from the cart
  const removeCartHandler = (item) => {
    ctxDispatch({ type: "CART_REMOVE_ITEM", payload: item });
  };

  // Function to handle the checkout process
  const checkoutHandler = () => {
    navigate("/signin?redirect=/shipping");
  };

  return (
    <div style={{ paddingTop: "20px" }}>
      <Helmet>
        <title>Cart</title>
      </Helmet>
      <h1>Cart</h1>
      <Row>
        {/* Error message */}
        <Col md={8}>
          {cartItems.length === 0 ? (
            <div className="info">
              Cart is empty/
              <a href="/" className="error-homepage-link">
                Homepage
              </a>
            </div>
          ) : (
            // Table of Cart Items
            <ListGroup>
              {cartItems.map((item) => (
                <ListGroup.Item className="product-info" key={item.id}>
                  <Row className="cart-table">
                    <Col md={4}>
                      <img
                        src={item.img}
                        alt={item.name}
                        className="img-fluid rounded img-thumbnail"
                      ></img>{" "}
                      <Link to={`/product/${item.slug}`}>{item.name}</Link>
                    </Col>
                    <Col md={3}>
                      <Button
                        className="cart-btn"
                        onClick={() =>
                          updateCartHandler(item, item.quantity - 1)
                        }
                        variant="light"
                        disabled={item.quantity === 1}
                      >
                        <i className="fas fa-minus-circle"></i>
                      </Button>{" "}
                      <span>{item.quantity}</span>{" "}
                      <Button
                        className="cart-btn"
                        variant="light"
                        onClick={() =>
                          updateCartHandler(item, item.quantity + 1)
                        }
                        disabled={item.quantity === item.countInStock}
                      >
                        <i className="fas fa-plus-circle"></i>
                      </Button>
                    </Col>
                    <Col md={3}>${item.price}</Col>
                    <Col md={2}>
                      <Button
                        className="cart-btn"
                        onClick={() => removeCartHandler(item)}
                        variant="light"
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <ListGroup variant="flush">
                {/* Information */}
                <ListGroup.Item className="product-info">
                  <h3>
                    Total ({cartItems.reduce((a, c) => a + c.quantity, 0)}{" "}
                    items): $
                    {cartItems.reduce((a, c) => a + c.price * c.quantity, 0)}
                  </h3>
                </ListGroup.Item>
                <ListGroup.Item className="product-info">
                  <div className="d-grid">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={checkoutHandler}
                      disabled={cartItems.length === 0}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
