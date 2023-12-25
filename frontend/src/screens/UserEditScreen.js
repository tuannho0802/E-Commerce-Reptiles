import React, { useContext, useEffect, useReducer, useState } from "react";
import axios from "axios";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import { Store } from "../Store";
import { getError } from "../utils";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

// Define reducer function for managing component state
const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "UPDATE_REQUEST":
      return { ...state, loadingUpdate: true };
    case "UPDATE_SUCCESS":
      return { ...state, loadingUpdate: false };
    case "UPDATE_FAIL":
      return { ...state, loadingUpdate: false };
    default:
      return state;
  }
};

export default function UserEditScreen() {
  // useReducer for managing component state
  const [{ loading, error, loadingUpdate }, dispatch] = useReducer(reducer, {
    loading: true,
    error: "",
  });

  // Context API hook to access global state
  const { state } = useContext(Store);
  const { userInfo } = state;

  // React Router hook to get route parameters (userId)
  const params = useParams();
  const { id: userId } = params;
  const navigate = useNavigate();

  // State variables for user details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch user data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        //send ajax request
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setName(data.name);
        setEmail(data.email);
        setIsAdmin(data.isAdmin);
        dispatch({ type: "FETCH_SUCCESS" });
      } catch (err) {
        dispatch({
          type: "FETCH_FAIL",
          payload: getError(err),
        });
      }
    };
    fetchData();
  }, [userId, userInfo]);

  // Submit handler for updating user details
  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch({ type: "UPDATE_REQUEST" });
      await axios.put(
        //put ajax request
        `/api/users/${userId}`,
        { _id: userId, name, email, isAdmin },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
      );
      dispatch({
        type: "UPDATE_SUCCESS",
      });
      toast.success("User updated successfully");
      navigate("/admin/users");
    } catch (error) {
      toast.error(getError(error));
      dispatch({ type: "UPDATE_FAIL" });
    }
  };

  return (
    <Container className="small-container">
      <Helmet>
        <title>Edit User {name}</title>
      </Helmet>
      <h1>Edit User {name}</h1>

      {/* Conditional Render */}
      {loading ? (
        <div className="loading-box" />
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <Form onSubmit={submitHandler}>
          {/* User Name */}
          <Form.Group className="mb-3" controlId="name">
            <Form.Label>
              <h3>Name</h3>
            </Form.Label>
            <Form.Control
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>

          {/* User Email (disabled for admin) */}
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>
              <h3>Email</h3>
            </Form.Label>
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 500, hide: 0 }}
              overlay={
                <Tooltip id="tooltip">
                  User's Email cannot be changed by admin
                </Tooltip>
              }
            >
              <Form.Control placeholder={email} disabled />
            </OverlayTrigger>
          </Form.Group>

          {/* User Actions (Admin switch) */}
          <Form.Check
            className="mb-3"
            type="switch"
            id="isAdmin"
            label={<strong>Admin</strong>}
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />

          <div className="mb-3">
            <Button variant="success" disabled={loadingUpdate} type="submit">
              Update
            </Button>
            {loadingUpdate && <div className="loading-box" />}
          </div>
        </Form>
      )}
    </Container>
  );
}
