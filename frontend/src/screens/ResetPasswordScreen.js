import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { getError } from "../utils";
import Axios from "axios";
import Container from "react-bootstrap/Container";
import { Helmet } from "react-helmet-async";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

export default function ResetPasswordScreen() {
  // Define navigate and token using React Router hooks
  const navigate = useNavigate();
  const { token } = useParams();

  // State variables for password and confirmPassword
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Get user info from global state
  const { state } = useContext(Store);
  const { userInfo } = state;

  // useEffect to check if user is already logged in or token is missing
  useEffect(() => {
    // If user is logged in or token is missing, redirect to home
    if (userInfo || !token) {
      navigate("/");
    }
  });

  // Define submitHandler for form submission
  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      // Check if passwords match
      toast.error("Passwords do not match");
      return;
    }
    try {
      // Send a request to reset the password
      await Axios.post("/api/users/reset-password", {
        password,
        token,
      });
      // Redirect to signin after successful password reset
      navigate("/signin");
      toast.success("Password updated successfully");
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <div>
      <Container className="small-container">
        <Helmet>
          <title>Reset Password</title>
        </Helmet>
        <h1 className="my-3">Reset Password</h1>
        <Form onSubmit={submitHandler}>
          <Form.Group className="mb-3" controlId="password">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="confirmPassword">
            <Form.Label>Confirm New Password</Form.Label>
            <Form.Control
              type="password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Form.Group>

          <div className="mb-3">
            <Button type="submit">Reset Password</Button>
          </div>
        </Form>
      </Container>
    </div>
  );
}
