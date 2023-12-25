import { useNavigate } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Helmet } from "react-helmet-async";
import Container from "react-bootstrap/Container";
import { getError } from "../utils";
import { toast } from "react-toastify";
import Axios from "axios";
import { Store } from "../Store";

export default function ForgetPasswordScreen() {
  // Use the useNavigate hook from 'react-router-dom' for navigation.
  const navigate = useNavigate();

  //set state
  const [email, setEmail] = useState("");

  // Access user info from the global state.
  const { state } = useContext(Store);
  const { userInfo } = state;

  // Redirect to the home page if the user is already logged in.
  useEffect(() => {
    if (userInfo) {
      navigate("/");
    }
  }, [navigate, userInfo]);

  // Handle form submission to request a password reset.
  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      // Send a POST request to the '/api/users/forget-password' endpoint with the user's email.
      const { data } = await Axios.post("/api/users/forget-password", {
        email,
      });
      toast.success(data.message);
    } catch (err) {
      toast.error(getError(err));
    }
  };

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
        You need to input correct email for changing password!!
      </header>
      <Container className="small-container">
        <Helmet>
          <title>Forget Password</title>
        </Helmet>
        <h1 className="my-3">Forget Password</h1>
        <Form onSubmit={submitHandler}>
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>

          <div className="mb-3">
            <Button type="submit">submit</Button>
          </div>
        </Form>
      </Container>
    </div>
  );
}
