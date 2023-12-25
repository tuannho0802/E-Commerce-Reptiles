import React, { useContext, useReducer, useState } from "react";
import { Helmet } from "react-helmet-async";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { getError } from "../utils";
import axios from "axios";

// Reducer function to manage component state
const reducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_REQUEST":
      return { ...state, loadingUpdate: true };
    case "UPDATE_SUCCESS":
      return { ...state, loadingUpdate: false };
    case "UPDATE_FAIL":
      return { ...state, loadingUpdate: false };
    case "UPLOAD_REQUEST":
      return { ...state, loadingUpload: true, errorUpload: "" };
    case "UPLOAD_SUCCESS":
      return {
        ...state,
        loadingUpload: false,
        errorUpload: "",
      };
    case "UPLOAD_FAIL":
      return { ...state, loadingUpload: false, errorUpload: action.payload };
    case "DELETE_AVATAR":
      return { ...state, avatar: "" };
    default:
      return state;
  }
};

export default function ProfileScreen() {
  // Context API hook to access global state
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;

  // State variables for user details
  const [name, setName] = useState(userInfo.name);
  const [email, setEmail] = useState(userInfo.email);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState(userInfo.avatar);

  // Use reducer for managing complex state changes
  const [{ loadingUpdate, loadingUpload }, dispatch] = useReducer(reducer, {
    loadingUpdate: false,
  });

  // Define submitHandler function for updating user profile
  const submitHandler = async (e) => {
    e.preventDefault();
    if (password === confirmPassword) {
      try {
        const { data } = await axios.put(
          "/api/users/profile",
          {
            name,
            email,
            password,
            avatar,
          },
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }
        );

        dispatch({
          type: "UPDATE_SUCCESS",
        });
        ctxDispatch({ type: "USER_SIGNIN", payload: data });
        localStorage.setItem("userInfo", JSON.stringify(data));
        toast.success("User updated successfully");
      } catch (err) {
        dispatch({
          type: "UPDATE_FAIL",
        });
        toast.error(getError(err));
      }
    } else {
      toast.error("Passwords do not match");
    }
  };

  // Define uploadAvatarHandler function for updating user avatar
  const uploadAvatarHandler = async (e) => {
    const file = e.target.files[0];
    const bodyFormData = new FormData();
    bodyFormData.append("file", file);
    try {
      dispatch({ type: "UPLOAD_REQUEST" });
      const { data } = await axios.post("/api/upload", bodyFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${userInfo.token}`,
        },
      });
      dispatch({ type: "UPLOAD_SUCCESS" });
      setAvatar(data.secure_url);
      toast.success("Avatar uploaded successfully");
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "UPLOAD_FAIL", payload: getError(err) });
    }
  };

  // Define deleteAvatarHandler function for removing user avatar
  const deleteAvatarHandler = async () => {
    try {
      dispatch({ type: "DELETE_AVATAR" });

      // Send a request to the server to update the avatar
      await axios.put(
        "/api/users/profile",
        { avatar: null }, // Set the avatar to null
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      setAvatar("");

      ctxDispatch({
        type: "USER_SIGNIN",
        payload: { ...userInfo, avatar: "" },
      });

      localStorage.setItem(
        "userInfo",
        JSON.stringify({ ...userInfo, avatar: "" })
      );

      toast.success(
        "Avatar removed successfully. Click update to apply changes!!"
      );
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <div className="container small-container">
      <Helmet>
        <title>User Profile</title>
      </Helmet>
      <h1 className="my-3">User Profile</h1>
      {/* Conditional render */}
      {loadingUpdate && <div className="loading-box" />}
      <form onSubmit={submitHandler}>
        {/* Avatar */}
        <Form.Group className="mb-3" controlId="avatar">
          {avatar && (
            <div>
              <img
                src={avatar}
                alt=""
                className="img-fluid img-thumbnail"
                style={{
                  marginBottom: "10px",
                  minWidth: "300px",
                  minHeight: "300px",
                  borderRadius: "50%",
                }}
              />
              <Form.Control
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
              <br />
              <Button
                variant="light"
                onClick={() => deleteAvatarHandler(avatar)}
                className="delete-btn"
              >
                <i className="fa fa-times-circle"></i> Remove Avatar
              </Button>
            </div>
          )}
          <br />
          <div className="mb-2">
            <Form.Control
              type="file"
              onChange={uploadAvatarHandler}
              accept="image/*"
            />
            {loadingUpload && <div className="loading-box" />}
          </div>
        </Form.Group>

        {/* Name */}
        <Form.Group className="mb-3" controlId="name">
          <Form.Label>Name</Form.Label>
          <Form.Control
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Form.Group>

        {/* Email */}
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        {/* Password */}
        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        {/* Confirm Password */}
        <Form.Group className="mb-3" controlId="confirmPassword">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type="password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Form.Group>

        <div className="mb-3">
          <Button type="submit">Update</Button>
          {loadingUpdate && <div className="loading-box" />}
        </div>
      </form>
    </div>
  );
}
