import React, { useContext, useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Helmet } from "react-helmet-async";
import Axios from "axios";
import { Store } from "../Store";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getError } from "../utils";

export default function SigninScreen() {
  // React Router hook for navigation
  const navigate = useNavigate();

  // React Router hook to get the current location
  const { search } = useLocation();
  const redirectInUrl = new URLSearchParams(search).get("redirect");
  const redirect = redirectInUrl ? redirectInUrl : "/";

  // State variables for email and password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Context API hook to access global state and dispatch
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;

  // Submit handler for the signin form
  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      // Send a POST request to the signin API
      const { data } = await Axios.post("/api/users/signin", {
        email,
        password,
      });
      // Dispatch action to update the global state with user information
      ctxDispatch({ type: "USER_SIGNIN", payload: data });

      // Save user information to local storage
      localStorage.setItem("userInfo", JSON.stringify(data));

      // Redirect to the specified location or the default one
      navigate(redirect || "/");
    } catch (err) {
      toast.error(getError(err));
    }
  };

  // Effect to check if the user is already signed in and redirect accordingly
  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, redirect, userInfo]);

  return (
    <div>
      <header
        style={{
          background: "#eab676",
          textAlign: "center",
          fontWeight: "bolder",
          fontSize: "18px",
        }}
      >
        <div className="fas fa-exclamation-triangle"></div> You need to sign in
        to continue!!
      </header>
      <Container className="small-container">
        <Helmet>
          <title>Sign In</title>
        </Helmet>

        <h1 className="my-3">Sign In</h1>
        <Form onSubmit={submitHandler}>
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>
          <div
            className="mb-3"
            style={{ paddingTop: "20px", paddingBottom: "20px" }}
          >
            <Button type="submit">Sign In</Button>
          </div>
          <div className="mb-3">
            New Customer?{" "}
            <Link
              style={{ fontWeight: "bold" }}
              to={`/signup?redirect=${redirect}`}
            >
              Create your Account
            </Link>
          </div>
          <div className="mb-3">
            Forget Password?{" "}
            <Link style={{ fontWeight: "bold" }} to={`/forget-password`}>
              Reset Password
            </Link>
          </div>
        </Form>
      </Container>
    </div>
  );
}
