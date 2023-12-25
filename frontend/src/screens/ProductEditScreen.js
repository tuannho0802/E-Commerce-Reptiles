import React, { useContext, useEffect, useReducer, useState } from "react";
import { Store } from "../Store";
import { getError } from "../utils";
import axios from "axios";
import { useParams } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import { Helmet } from "react-helmet-async";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { toast } from "react-toastify";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Define a reducer function to handle various states
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

export default function ProductEditScreen() {
  // Access the navigate function for redirection

  // Get productId from the URL params
  const params = useParams();
  const { id: productId } = params;

  // Access userInfo from the global state
  const { state } = useContext(Store);
  const { userInfo } = state;

  // Set state show dialog
  const [showDialog, setShowDialog] = useState(false);

  // Define loading state for delete action
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Use reducer hook to manage complex state logic
  const [
    { loading, error, loadingUpdate, loadingUpload, errorUpload },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    error: "",
    errorUpload: "",
  });

  // Define state variables for product details
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [img, setImg] = useState("");
  const [imgs, setImgs] = useState([]);
  const [category, setCategory] = useState("");
  const [countInStock, setCountInStock] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");

  // Fetch product details using useEffect
  useEffect(() => {
    const fetchData = async () => {
      //send ajax request
      try {
        dispatch({ type: "FETCH_REQUEST" });
        // Fetch product details from the backend
        const { data } = await axios.get(`/api/products/${productId}`);

        // Set state variables with fetched data
        setName(data.name);
        setSlug(data.slug);
        setPrice(data.price);
        setImg(data.img);
        setImgs(data.imgs);
        setCategory(data.category);
        setCountInStock(data.countInStock);
        setCountry(data.country);
        setDescription(data.description);
        dispatch({ type: "FETCH_SUCCESS" });
      } catch (err) {
        dispatch({
          type: "FETCH_FAIL",
          payload: getError(err),
        });
      }
    };
    fetchData();
  }, [productId]);

  // Handle form submission to update the product
  const submitHandler = async (e) => {
    e.preventDefault();
    // send ajax request
    try {
      dispatch({ type: "UPDATE_REQUEST" });
      // Send an update request to the backend
      await axios.put(
        `/api/products/${productId}`,
        {
          _id: productId,
          name,
          slug,
          price,
          img,
          imgs,
          category,
          country,
          countInStock,
          description,
        },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
      );
      dispatch({ type: "UPDATE_SUCCESS" });
      toast.success("Product updated successfully!!");

      // Show the dialog
      setShowDialog(true);
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "UPDATE_FAIL" });
    }
  };

  // Handle file upload for product images
  const uploadFileHandler = async (e, forImgs) => {
    const file = e.target.files[0];
    const bodyFormData = new FormData();
    bodyFormData.append("file", file);
    try {
      dispatch({ type: "UPLOAD_REQUEST" });
      // Send a file upload request to the backend
      const { data } = await axios.post("/api/upload", bodyFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
          authorization: `Bearer ${userInfo.token}`,
        },
      });
      dispatch({ type: "UPLOAD_SUCCESS" });

      // Update the state based on whether it is for product images or the main product image
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
        <title>Edit Product {name}</title>
      </Helmet>
      <h1>
        Edit Product <strong>{name}</strong>
      </h1>

      {loading ? (
        <div className="loading-box" />
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <Form onSubmit={submitHandler}>
          {/* Name */}
          <Form.Group className="mb-3" controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>

          {/* Slug */}
          <Form.Group className="mb-3" controlId="slug">
            <Form.Label>Slug</Form.Label>
            <Form.Control
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </Form.Group>

          {/* Price */}
          <Form.Group className="mb-3" controlId="name">
            <Form.Label>Price</Form.Label>
            <Form.Control
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </Form.Group>

          {/* Image */}
          <Form.Group className="mb-3" controlId="img">
            <Form.Label>Image File</Form.Label>
            {img && (
              <img
                src={img}
                alt="Product"
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
            <Form.Label>Upload Image</Form.Label>
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

          {/* Category */}
          <Form.Group className="mb-3" controlId="category">
            <Form.Label>Category</Form.Label>
            <Form.Control
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </Form.Group>

          {/* Country */}
          <Form.Group className="mb-3" controlId="country">
            <Form.Label>Country</Form.Label>
            <Form.Control
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
          </Form.Group>

          {/* Count in Stock */}
          <Form.Group className="mb-3" controlId="countInStock">
            <Form.Label>Count In Stock</Form.Label>
            <Form.Control
              value={countInStock}
              onChange={(e) => setCountInStock(e.target.value)}
              required
            />
          </Form.Group>

          {/* Description */}
          <Form.Group className="mb-3" controlId="description">
            <Form.Label>Description</Form.Label>
            <ReactQuill
              style={{ backgroundColor: "#fff" }}
              value={description}
              onChange={(value) => setDescription(value)}
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
          </Form.Group>

          <div className="mb-3">
            <Button disabled={loadingUpdate} type="submit">
              Update
            </Button>

            {loadingUpdate && <div className="loading-box" />}
          </div>
        </Form>
      )}

      <Modal show={showDialog} onHide={() => setShowDialog(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Navigation Options</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Where do you want to navigate?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => (window.location.href = "/admin/products")}
          >
            Products Management
          </Button>

          <Button
            variant="success"
            onClick={() => (window.location.href = `/product/${slug}`)}
          >
            Product Details Updated
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
