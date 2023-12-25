import axios from "axios";
import { useContext, useEffect, useReducer, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Form from "react-bootstrap/Form";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Rating from "../components/Rating";
import { Helmet } from "react-helmet-async";
import { getError } from "../utils";
import { Store } from "../Store";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import { toast } from "react-toastify";
import Modal from "react-bootstrap/Modal";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import DOMPurify from "dompurify";

// Reducer function to manage state transitions
const reducer = (state, action) => {
  switch (action.type) {
    case "REFRESH_PRODUCT":
      return { ...state, product: action.payload };
    case "CREATE_REQUEST":
      return { ...state, loadingCreateReview: true };
    case "CREATE_SUCCESS":
      return { ...state, loadingCreateReview: false };
    case "CREATE_FAIL":
      return { ...state, loadingCreateReview: false };
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, product: action.payload, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "FETCH_RELATED_REQUEST":
      return { ...state, loadingRelated: true };
    case "FETCH_RELATED_SUCCESS":
      return {
        ...state,
        relatedProducts: action.payload,
        loadingRelated: false,
      };
    case "FETCH_RELATED_FAIL":
      return { ...state, loadingRelated: false, relatedError: action.payload };
    default:
      return state;
  }
};

function ProductScreen() {
  // Ref for referencing a DOM element
  let reviewsRef = useRef();

  // State variables for managing various aspects of the component
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedImg, setSelectedImg] = useState("");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Add a new state to track the review to be edited
  const [editReview, setEditReview] = useState(null);

  //preview the image
  const handleImageClick = (img) => {
    setSelectedImg(img);
    setShowImageModal(true);
  };

  const navigate = useNavigate();

  // Access route parameters
  const params = useParams();
  const { slug } = params;

  // State management using useReducer hook
  const [
    {
      loading,
      error,
      product,
      loadingCreateReview,
      loadingRelated,
      relatedError,
      relatedProducts,
    },
    dispatch,
  ] = useReducer(reducer, {
    product: [],
    loading: true,
    error: "",
    relatedProducts: [],
    loadingRelated: false,
    relatedError: "",
  });

  // Access global state
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, userInfo } = state;

  // useEffect to fetch product data and related products when component mounts
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: "FETCH_REQUEST" });
      try {
        const result = await axios.get(`/api/products/slug/${slug}`);
        console.log("API result:", result.data);
        dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        //load main img of product
        setSelectedImg(result.data.img);
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };

    fetchData();

    // Show toasts based on certain conditions
    //show popup submit
    const reviewSubmitted = localStorage.getItem("reviewSubmitted");
    if (reviewSubmitted) {
      toast.success("Review submitted successfully");

      localStorage.removeItem("reviewSubmitted");
    }
    //show popup delete
    const reviewDeleted = localStorage.getItem("reviewDeleted");
    if (reviewDeleted) {
      toast.success("Review deleted successfully");
      localStorage.removeItem("reviewDeleted");
    }

    //show popup submit
    const reviewEdited = localStorage.getItem("reviewEdited");
    if (reviewEdited) {
      toast.success("Review edited successfully");

      localStorage.removeItem("reviewEdited");
    }
  }, [slug, ctxDispatch, userInfo, loadingCreateReview]);

  // useEffect to fetch related products when the product._id is available
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      dispatch({ type: "FETCH_RELATED_REQUEST" });
      try {
        const result = await axios.get(`/api/products/${product._id}/related`);
        dispatch({ type: "FETCH_RELATED_SUCCESS", payload: result.data });
      } catch (err) {
        dispatch({ type: "FETCH_RELATED_FAIL", payload: getError(err) });
      }
    };

    // Call the fetchRelatedProducts function if product._id is available
    if (product._id) {
      fetchRelatedProducts();
    }
  }, [product._id]);

  // Function to handle adding a product to the cart
  const addToCartHandler = async () => {
    // Check if the product is already in the cart
    const existItem = cart.cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;

    // Fetch product data to check countInStock
    const { data } = await axios.get(`/api/products/${product._id}`);
    if (data.countInStock < quantity) {
      window.alert("Sorry. Product is out of stock");
      return;
    }

    // Dispatch action to add the product to the cart
    ctxDispatch({
      type: "CART_ADD_ITEM",
      payload: { ...product, quantity },
    });

    // Navigate to the cart page
    navigate("/cart");
  };

  // Function to handle the submission of a new review
  const submitHandler = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error("Please enter rating");
      return;
    }

    // Check if user information is available, if not, load it
    if (!userInfo) {
      try {
        const userInfoResult = await axios.get("/api/user");
        ctxDispatch({ type: "LOAD_USER_INFO", payload: userInfoResult.data });
      } catch (error) {
        toast.error("Error loading user information. Please try again.");
        return;
      }
    }

    try {
      // Submit the review with user information if available
      const reviewData = {
        rating,
        comment,
        user: userInfo ? userInfo._id : null,
        avatar: userInfo ? userInfo._id : null,
      };

      if (userInfo) {
        reviewData.name = userInfo.name;
      }

      const { data } = await axios.post(
        `/api/products/${product._id}/reviews`,
        reviewData,
        {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        }
      );

      // Clear the form fields after successful review submission
      setRating(0);
      setComment("");

      // Update the product information after successful review submission
      const updatedProduct = {
        ...product,
        reviews: [data.review, ...product.reviews],
        numReviews: data.numReviews,
        rating: data.rating,
      };

      dispatch({
        type: "REFRESH_PRODUCT",
        payload: updatedProduct,
      });

      dispatch({
        type: "CREATE_SUCCESS",
      });

      // Scroll to the bottom of the reviews section
      window.scrollTo({
        behavior: "smooth",
        top: reviewsRef.current.offsetBottom,
      });

      // Show success toast and navigate to the product page
      toast.success(data.message);
      navigate(`/product/${slug}`);
    } catch (error) {
      toast.error(getError(error));
      dispatch({ type: "CREATE_FAIL" });
    }
  };

  // Function to handle the deletion of a review
  const deleteReviewHandler = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        const { data } = await axios.delete(
          `/api/products/${product._id}/reviews/${reviewId}`,
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }
        );

        dispatch({
          type: "REFRESH_PRODUCT",
          payload: data.product,
        });

        window.scrollTo({
          behavior: "smooth",
          top: reviewsRef.current.offsetBottom,
        });

        //show popup delete
        const reviewDeleted = localStorage.getItem("reviewDeleted");
        if (reviewDeleted) {
          toast.success(data.message);
          localStorage.removeItem("reviewDeleted");
        }

        // Reload the window and save local storage
        localStorage.setItem("reviewDeleted", "true");

        window.location.reload();
      } catch (error) {
        toast.error(getError(error));
      }
    }
  };

  // Function to handle the submission of an edited review
  const handleEditReview = async (e) => {
    e.preventDefault();

    if (!rating) {
      toast.error("Please enter rating");
      return;
    }

    try {
      // Make an API request to edit the review
      const { data } = await axios.put(
        `/api/products/${product._id}/reviews/${editReview._id}`,
        {
          rating,
          comment,
        },
        {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        }
      );

      // Update the product information after successful review edit
      const updatedProduct = {
        ...product,
        reviews: product.reviews.map((r) =>
          r._id === editReview._id ? data.review : r
        ),
        rating: data.rating,
      };

      dispatch({
        type: "REFRESH_PRODUCT",
        payload: updatedProduct,
      });

      // Scroll to the bottom of the reviews section
      window.scrollTo({
        behavior: "smooth",
        top: reviewsRef.current.offsetBottom,
      });

      // Clear the editReview state
      setEditReview(null);

      //show popup delete
      const reviewEdited = localStorage.getItem("reviewEdited");
      if (reviewEdited) {
        toast.success(data.message);
        localStorage.removeItem("reviewEdited");
      }

      // Reload the window and save local storage
      localStorage.setItem("reviewEdited", "true");

      window.location.reload();
    } catch (error) {
      toast.error(getError(error));
    }
  };

  // Function to render the delete review button based on user permissions
  const renderDeleteButton = (review) => {
    if (userInfo) {
      if (userInfo.isAdmin) {
        // Admin can delete any review
        return (
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteReviewHandler(review._id)}
          >
            <div className="fas fa-eraser"></div> Delete{" "}
            <strong style={{ color: "burlywood" }}>(Admin)</strong>
          </Button>
        );
      } else if (userInfo._id === review.user?._id) {
        // User can delete their own review
        return (
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteReviewHandler(review._id)}
          >
            <div className="fas fa-eraser"></div> Delete
          </Button>
        );
      }
    }
    return null;
  };

  // Function to render the edit button based on user permissions
  const renderEditButton = (review) => {
    if (userInfo && userInfo._id === review.user?._id) {
      return (
        <Button
          variant="success"
          size="sm"
          style={{ marginLeft: "10px" }}
          onClick={() => setEditReview(review)}
        >
          <div className="fas fa-edit"></div> Edit
        </Button>
      );
    }
    return null;
  };

  // Function to render the edit product button for admins
  const renderEditProduct = () => {
    if (userInfo && userInfo.isAdmin) {
      return (
        <Link to={`/admin/product/${product._id}`}>
          <Button variant="secondary" className="my-3">
            <div className="fas fa-edit"></div> Edit Product{" "}
            <strong style={{ color: "#e6778d" }}>(Admin)</strong>
          </Button>
        </Link>
      );
    }
    return null;
  };

  return loading ? (
    <div className="loading-box" />
  ) : error ? (
    <div className="error" variant="danger">
      {error}
    </div>
  ) : (
    <div style={{ marginTop: "10px" }}>
      <Row>
        <Col md={6}>
          {selectedImg && (
            <Card className="mb-2 appear-animation">
              <img
                style={{
                  cursor: "pointer",
                }}
                src={selectedImg || product.img}
                alt={product.name}
                className="img-product"
                onClick={() => handleImageClick(selectedImg || product.img)}
              />
            </Card>
          )}
        </Col>

        <Col md={3}>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <Helmet>
                <title>{product.name}</title>
              </Helmet>
              <h1>{product.name}</h1>
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>
                <div className="fas fa-coins"></div> Product Sold:{" "}
              </strong>
              {product.sold}
            </ListGroup.Item>
            <ListGroup.Item>
              <Rating
                rating={product.rating}
                numReviews={product.numReviews}
              ></Rating>
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>
                <div className="fas fa-store"></div> In Stock:{" "}
              </strong>
              {product.countInStock}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>
                <div className="fas fa-globe"></div> Country:{" "}
              </strong>
              {product.country}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>
                <div className="fas fa-frog"></div> Category:{" "}
              </strong>
              {product.category}
            </ListGroup.Item>
            {/* Images */}
            <ListGroup.Item>
              <Row xs={1} md={2} className="g-2">
                {[product.img, ...product.imgs].map((x) => (
                  <Col key={x}>
                    <Card>
                      <Button
                        className="thumbnail-card"
                        type="button"
                        variant="light"
                        onClick={() => setSelectedImg(x)}
                      >
                        <Card.Img
                          variant="top"
                          src={x}
                          alt="product"
                          className="appear-animation"
                        ></Card.Img>
                      </Button>
                    </Card>
                  </Col>
                ))}
              </Row>
            </ListGroup.Item>
          </ListGroup>
        </Col>

        <Col md={3}>
          <Card>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Row>
                    <Col>
                      <strong>Price:</strong>
                    </Col>
                    <Col>${product.price}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>
                      <strong>Status:</strong>
                    </Col>
                    <Col>
                      {product.countInStock > 0 ? (
                        <Badge bg="success">In Stock</Badge>
                      ) : (
                        <Badge bg="danger">Unavailable</Badge>
                      )}
                    </Col>
                  </Row>
                </ListGroup.Item>

                {product.countInStock > 0 && (
                  <ListGroup.Item>
                    <div className="d-grid">
                      <Button onClick={addToCartHandler} variant="success">
                        <div className="fas fa-cart-plus"></div> Add to Cart
                      </Button>
                    </div>
                  </ListGroup.Item>
                )}
                {/* Admin Edit Product Button */}
                <ListGroup.Item>{renderEditProduct()}</ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Display related products */}
      {loadingRelated ? (
        <div className="loading-box" />
      ) : relatedError ? (
        <div className="error">{relatedError}</div>
      ) : relatedProducts.length === 0 ? (
        <div className="info">No related products available.</div>
      ) : (
        <div>
          <h1>
            <Badge bg="info">Related Products</Badge>
          </h1>

          <Row xs={1} md={6} className="g-4">
            {relatedProducts.map((relatedProduct) => (
              <Col key={relatedProduct._id}>
                <Card className="thumbnail-card appear-animation">
                  <Link to={`/product/${relatedProduct.slug}`}>
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id="tooltip">{relatedProduct.name}</Tooltip>
                      }
                    >
                      <Card.Img
                        variant="top"
                        src={relatedProduct.img}
                        alt={relatedProduct.name}
                      />
                    </OverlayTrigger>
                  </Link>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      <div className="my-3">
        {/* Show more Description */}
        <Card style={{ padding: "10px" }}>
          <strong style={{ fontSize: "36px" }}>Description:</strong>
          <div style={{ marginBottom: "15px" }}>
            {product.description.length > 500 ? (
              <>
                {showFullDescription ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(product.description),
                    }}
                  />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        `${product.description.slice(0, 500)}...`
                      ),
                    }}
                  />
                )}
                <span
                  className="hoverable"
                  onClick={() => setShowFullDescription(!showFullDescription)}
                >
                  {showFullDescription ? " Show Less" : " Show More"}
                </span>
              </>
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(product.description),
                }}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Reviews */}
      <div className="my-3">
        <h2 ref={reviewsRef}>Reviews</h2>
        <div className="mb-3">
          {product.reviews.length === 0 && (
            <div className="validation">There is no review</div>
          )}
        </div>

        {/* Display Reviews for non-login users */}
        {!userInfo && (
          <ListGroup>
            {product.reviews.map((review) => (
              <ListGroup.Item style={{ marginBottom: "10px" }} key={review._id}>
                <div style={{ display: "flex", alignItems: "top" }}>
                  {review.user && review.user.avatar ? (
                    // Show user name when pointing to the user avatar
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id="tooltip">
                          {userInfo && userInfo._id === review.user?._id
                            ? "You"
                            : review.user && review.user.name
                            ? review.user.name
                            : "Anonymous"}
                        </Tooltip>
                      }
                    >
                      <img
                        src={review.user.avatar}
                        alt="User Avatar"
                        style={{
                          marginRight: "8px",
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                        }}
                      />
                    </OverlayTrigger>
                  ) : (
                    <img
                      src="https://res.cloudinary.com/ecomerce-shopping-reptiles/image/upload/v1700631306/reptile-icon-28_cbdviq.jpg"
                      alt="Default Avatar"
                      style={{
                        marginRight: "8px",
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                  <div>
                    <strong
                      style={{
                        fontSize:
                          userInfo && userInfo._id === review.user?._id
                            ? "18px"
                            : "inherit",
                        color:
                          userInfo && userInfo._id === review.user?._id
                            ? "red"
                            : "inherit",
                      }}
                    >
                      {userInfo && userInfo._id === review.user?._id ? (
                        "You"
                      ) : review.user && review.user.isAdmin ? (
                        <span>
                          {review.user.name}{" "}
                          <span style={{ color: "red" }}>(Admin)</span>
                        </span>
                      ) : review.user && review.user.name ? (
                        review.user.name
                      ) : (
                        "Anonymous"
                      )}
                    </strong>

                    <Rating rating={review.rating} caption=" "></Rating>
                    <p>
                      <strong>Date:</strong> {review.createdAt.substring(0, 10)}
                    </p>
                    <p>{review.comment}</p>
                    {renderDeleteButton(review)}
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        {/* Display Reviews for login users */}
        {userInfo && (
          <ListGroup>
            {product.reviews.map((review) => (
              <ListGroup.Item style={{ marginBottom: "10px" }} key={review._id}>
                <div style={{ display: "flex", alignItems: "top" }}>
                  {review.user && review.user.avatar ? (
                    // Show user name when pointing to the user avatar
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id="tooltip">
                          {userInfo && userInfo._id === review.user?._id
                            ? "You"
                            : review.user && review.user.name
                            ? review.user.name
                            : "Anonymous"}
                        </Tooltip>
                      }
                    >
                      <img
                        src={review.user.avatar}
                        alt="User Avatar"
                        style={{
                          marginRight: "8px",
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                        }}
                      />
                    </OverlayTrigger>
                  ) : (
                    <img
                      src="https://res.cloudinary.com/ecomerce-shopping-reptiles/image/upload/v1700631306/reptile-icon-28_cbdviq.jpg"
                      alt="Default Avatar"
                      style={{
                        marginRight: "8px",
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                  <div>
                    <strong
                      style={{
                        fontSize:
                          userInfo && userInfo._id === review.user?._id
                            ? "18px"
                            : "inherit",
                        color:
                          userInfo && userInfo._id === review.user?._id
                            ? "red"
                            : "inherit",
                      }}
                    >
                      {userInfo && userInfo._id === review.user?._id ? (
                        "You"
                      ) : review.user && review.user.isAdmin ? (
                        <span>
                          {review.user.name}{" "}
                          <span style={{ color: "red" }}>(Admin)</span>
                        </span>
                      ) : review.user && review.user.name ? (
                        review.user.name
                      ) : (
                        "Anonymous"
                      )}
                    </strong>

                    <Rating rating={review.rating} caption=" "></Rating>

                    {/* Check review are update or not to display */}
                    {review.updatedAt === review.createdAt ? (
                      <div
                        style={{
                          display: "flex",
                          color: "#949292",
                          filter: "blur(0.3px)",
                        }}
                      >
                        <strong>Posted:</strong>{" "}
                        <p>
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          color: "#949292",
                          filter: "blur(0.3px)",
                        }}
                      >
                        <strong>Updated:</strong>{" "}
                        <p>
                          {new Date(review.updatedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    )}

                    <p>{review.comment}</p>

                    {renderDeleteButton(review)}
                    {renderEditButton(review)}
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        <div className="my-3">
          {userInfo ? (
            <form onSubmit={submitHandler}>
              <h2>
                <Badge pill>Write a customer review</Badge>
              </h2>
              <Form.Group className="mb-3" controlId="rating">
                <Form.Label style={{ fontSize: "18px", fontWeight: "bold" }}>
                  <h3>Rating</h3>
                </Form.Label>
                <Form.Select
                  aria-label="Rating"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  <option value="" style={{ color: "black" }}>
                    Select...
                  </option>
                  <option value="1" style={{ color: "#ffc000" }}>
                    1 &#9733;
                  </option>
                  <option value="2" style={{ color: "#ffc000" }}>
                    2 &#9733;
                  </option>
                  <option value="3" style={{ color: "#ffc000" }}>
                    3 &#9733;
                  </option>
                  <option value="4" style={{ color: "#ffc000" }}>
                    4 &#9733;
                  </option>
                  <option value="5" style={{ color: "#ffc000" }}>
                    5 &#9733;
                  </option>
                </Form.Select>
              </Form.Group>
              <FloatingLabel
                controlId="floatingTextarea"
                label="Comments"
                className="mb-3"
              >
                <Form.Control
                  as="textarea"
                  placeholder="Leave a comment here"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </FloatingLabel>

              <div className="mb-3">
                <Button disabled={loadingCreateReview} type="submit">
                  <div className="fas fa-comment-dots"></div> Submit
                </Button>
                {loadingCreateReview && <div className="loading-box"></div>}
              </div>
            </form>
          ) : (
            <div className="warning">
              Please{" "}
              <Link
                style={{ paddingLeft: "5px", paddingRight: "5px" }}
                to={`/signin?redirect=/product/${product.slug}`}
              >
                Sign In
              </Link>{" "}
              to write a review
            </div>
          )}
        </div>
      </div>

      <Modal show={showImageModal} onHide={() => setShowImageModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip id="tooltip">{product.name}</Tooltip>}
          >
            <img
              src={selectedImg}
              alt={product.name}
              style={{ width: "100%" }}
            />
          </OverlayTrigger>
          <br style={{ padding: "10px" }} />
          <Row xs={1} md={2} className="g-2">
            {[product.img, ...product.imgs].map((x) => (
              <Col key={x}>
                <Card>
                  <Button
                    className="thumbnail-card"
                    type="button"
                    variant="light"
                    onClick={() => setSelectedImg(x)}
                  >
                    <Card.Img
                      variant="top"
                      src={x}
                      alt="product"
                      className="appear-animation"
                    ></Card.Img>
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add a modal for editing reviews */}
      <Modal show={editReview !== null} onHide={() => setEditReview(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Review</Modal.Title>
        </Modal.Header>

        {/* Create a form for editing reviews */}
        <Form onSubmit={handleEditReview}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="rating-edit">
              <Form.Label style={{ fontSize: "18px", fontWeight: "bold" }}>
                <h4>Rating</h4>
              </Form.Label>
              <Form.Select
                aria-label="Rating"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                <option value="" style={{ color: "black" }}>
                  Select...
                </option>
                <option value="1" style={{ color: "#ffc000" }}>
                  1 &#9733;
                </option>
                <option value="2" style={{ color: "#ffc000" }}>
                  2 &#9733;
                </option>
                <option value="3" style={{ color: "#ffc000" }}>
                  3 &#9733;
                </option>
                <option value="4" style={{ color: "#ffc000" }}>
                  4 &#9733;
                </option>
                <option value="5" style={{ color: "#ffc000" }}>
                  5 &#9733;
                </option>
              </Form.Select>
            </Form.Group>
            <h4>Comment</h4>
            <FloatingLabel
              controlId="comment-edit"
              label="Comments"
              className="mb-3"
            >
              <Form.Control
                as="textarea"
                placeholder="Leave a comment here"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </FloatingLabel>

            <div className="mb-3">
              {loadingCreateReview && <div className="loading-box"></div>}
            </div>
            <Modal.Footer>
              <Button type="submit">Save Changes</Button>
            </Modal.Footer>
          </Modal.Body>
        </Form>
      </Modal>
    </div>
  );
}
export default ProductScreen;
