import React, { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import CheckoutSteps from "../components/CheckoutSteps";
import { Store } from "../Store";

export default function PaymentMethodScreen() {
  // Access the navigation function for redirecting
  const navigate = useNavigate();

  // Access the global state and dispatch function using useContext
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    cart: { shippingAddress, paymentMethod },
  } = state;

  // Initialize local state for the selected payment method
  const [paymentMethodName, setPaymentMethod] = useState(
    paymentMethod || "PayPal" || "Stripe"
  );

  // Navigate to the shipping address screen if the address is not available
  useEffect(() => {
    if (!shippingAddress.address) {
      navigate("/shipping");
    }
  }, [shippingAddress, navigate]);

  // Define the submit handler for the payment method form
  const submitHandler = (e) => {
    e.preventDefault();
    // Dispatch an action to save the selected payment method to the global state
    ctxDispatch({ type: "SAVE_PAYMENT_METHOD", payload: paymentMethodName });
    // Save the payment method to localStorage for persistence
    localStorage.setItem("paymentMethod", paymentMethodName);
    // Navigate to the place order screen
    navigate("/placeorder");
  };

  return (
    <div style={{ paddingTop: "20px" }}>
      <CheckoutSteps step1 step2 step3></CheckoutSteps>
      <div className="container small-container">
        <Helmet>
          <title>Payment Method</title>
        </Helmet>
        <h1 className="my-3">Payment Method</h1>
        <Form onSubmit={submitHandler}>
          <div className="mb-3">
            <Form.Check
              type="radio"
              id="PayPal"
              label="PayPal"
              value="PayPal"
              checked={paymentMethodName === "PayPal"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <Form.Check
              type="radio"
              id="Stripe"
              label="Stripe"
              value="Stripe"
              checked={paymentMethodName === "Stripe"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <Button type="submit">Continue</Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
