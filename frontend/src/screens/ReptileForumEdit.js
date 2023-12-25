import React, { useContext, useEffect, useReducer, useState } from "react";
import { Store } from "../Store";
import { getError } from "../utils";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import { Helmet } from "react-helmet-async";
import Button from "react-bootstrap/Button";
import { toast } from "react-toastify";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Define reducer function to manage state transitions
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
    default:
      return state;
  }
};

export default function ForumEditScreen() {
  // Define navigate
  const navigate = useNavigate();

  // Get postId from URL parameters
  const { postId } = useParams();

  // Access userInfo from global state
  const { state } = useContext(Store);
  const { userInfo } = state;

  // Define loading state for delete action
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Use reducer to manage complex state transitions
  const [
    { loading, error, loadingUpdate, loadingUpload, errorUpload },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    error: "",
    errorUpload: "",
  });

  // Define state variables for the forum post
  const [user, setUser] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [img, setImg] = useState("");
  const [imgs, setImgs] = useState([]);

  // Handler for text change in the ReactQuill editor
  const textChange = (value) => {
    setText(value);
  };

  // useEffect to fetch data when component mounts or postId changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/forum/edit/${postId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setUser(data.user);
        setText(data.text);
        setTitle(data.title);
        setImg(data.img);
        setImgs(data.imgs);

        dispatch({ type: "FETCH_SUCCESS" });
      } catch (err) {
        dispatch({
          type: "FETCH_FAIL",
          payload: getError(err),
        });
      }
    };

    fetchData();
  }, [postId, userInfo]);

  // Handler for form submission
  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch({ type: "UPDATE_REQUEST" });
      // Send AJAX request to update the post
      await axios.put(
        `/api/forum/edit/${postId}`,
        {
          _id: postId,
          user,
          title,
          text,
          img,
          imgs,
        },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
      );
      dispatch({ type: "UPDATE_SUCCESS" });
      toast.success("Post updated successfully!!");
      navigate(`/forum/${postId}`);
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "UPDATE_FAIL" });
    }
  };

  // Handler for uploading files
  const uploadFileHandler = async (e, forImgs) => {
    const file = e.target.files[0];
    const bodyFormData = new FormData();
    bodyFormData.append("file", file);
    try {
      dispatch({ type: "UPLOAD_REQUEST" });
      // Send AJAX request to upload the file
      const { data } = await axios.post("/api/upload", bodyFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
          authorization: `Bearer ${userInfo.token}`,
        },
      });
      dispatch({ type: "UPLOAD_SUCCESS" });

      // Update state based on whether it's an image or additional images
      if (forImgs) {
        setImgs([...imgs, data.secure_url]);
      } else {
        setImg(data.secure_url);
      }
      toast.success(
        "Image uploaded successfully. Click Update to apply changes!!"
      );
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "UPLOAD_FAIL" });
    }
  };

  const deleteFileHandler = async (fileName) => {
    try {
      // Set loading state to true when starting the delete action
      setDeleteLoading(true);
      // Extract the public ID from the file name
      const publicId = fileName.split("/").pop().split(".")[0];

      // Make a DELETE request to the backend API to delete the file
      const response = await axios.delete(`/api/delete/${publicId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });

      console.log("Delete File Response:", response);

      // Update the state to remove the deleted file from the images array
      setImgs(imgs.filter((x) => x !== fileName));

      toast.success(
        "Image removed successfully. Click update to apply changes!!"
      );
    } catch (err) {
      toast.error(getError(err));
    } finally {
      // Set loading state back to false when the delete action is complete
      setDeleteLoading(false);
    }
  };

  return (
    <Container className="small-container">
      <Helmet>
        <title>Edit Post</title>
      </Helmet>
      <h1>Edit Post</h1>

      {loading ? (
        <div className="loading-box" />
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <Form onSubmit={submitHandler}>
          {/* Title */}
          <Form.Group className="mb-3" controlId="title">
            <Form.Label>Title</Form.Label>
            <Form.Control
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>

          {/* Text */}
          <ReactQuill
            className="mb-3"
            style={{ backgroundColor: "#fff" }}
            value={text}
            onChange={textChange}
            modules={{
              toolbar: [
                ["bold", "italic", "underline", "strike"],
                ["link"],
                ["clean"],
              ],
            }}
            formats={["bold", "italic", "underline", "strike", "link"]}
            placeholder="Write something..."
          />

          {/* Image */}
          <Form.Group className="mb-3" controlId="img">
            <Form.Label>Image File</Form.Label>
            {img && (
              <img
                src={img}
                alt="Post"
                className="img-fluid rounded img-thumbnail"
                style={{ marginBottom: "10px" }}
              />
            )}
            <Form.Control
              value={img}
              onChange={(e) => setImg(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="imgFile">
            <Form.Label>Upload Images</Form.Label>
            <Form.Control type="file" onChange={uploadFileHandler} />
            {loadingUpload && <div className="loading-box" />}
          </Form.Group>
          <Form.Group className="mb-3" controlId="additionalImg">
            <Form.Label>Additional Images</Form.Label>
            {imgs.length === 0 && <div className="info">No Image</div>}
            <Row xs={1} md={2} lg={3} className="g-4">
              {imgs.map((imageUrl) => (
                <Col key={imageUrl}>
                  <ListGroup.Item className="additional-img-container">
                    <img
                      src={imageUrl}
                      alt=""
                      className="img-fluid rounded img-thumbnail additional-img"
                    />
                    <Button
                      variant="danger"
                      onClick={() => deleteFileHandler(imageUrl)}
                      disabled={deleteLoading} // Disable the delete button when loading
                    >
                      {deleteLoading ? (
                        <div className="loading-box" />
                      ) : (
                        <i className="fa fa-times-circle"></i>
                      )}
                    </Button>
                  </ListGroup.Item>
                </Col>
              ))}
            </Row>
          </Form.Group>

          <Form.Group className="mb-3" controlId="additionalImgFile">
            <Form.Label>Upload Additional Image</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => uploadFileHandler(e, true)}
              isInvalid={Boolean(errorUpload)}
            />
            {loadingUpload && <div className="loading-box"></div>}
            {errorUpload && (
              <Form.Control.Feedback type="invalid">
                {errorUpload}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <div className="mb-3">
            <Button disabled={loadingUpdate} type="submit">
              Update
            </Button>

            {loadingUpdate && <div className="loading-box" />}
          </div>
        </Form>
      )}
    </Container>
  );
}
