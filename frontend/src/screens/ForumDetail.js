import React, {
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import { Helmet } from "react-helmet-async";
import { getError } from "../utils";
import { toast } from "react-toastify";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import { Store } from "../Store";
import DOMPurify from "dompurify";
import Badge from "react-bootstrap/Badge";

// Reducer function to manage state changes
const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, post: action.payload, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "CREATE_REQUEST":
      return { ...state, loadingCreateComment: true };
    case "CREATE_SUCCESS":
      return { ...state, loadingCreateComment: false };
    case "CREATE_FAIL":
      return { ...state, loadingCreateComment: false };
    case "LIKE_REQUEST":
      return { ...state, loadingLike: true };
    case "LIKE_SUCCESS":
      return {
        ...state,
        loadingLike: false,
        post: { ...state.post, likes: action.payload.likes },
      };
    case "LIKE_FAIL":
      return { ...state, loadingLike: false, likeError: action.payload };
    case "DISLIKE_REQUEST":
      return { ...state, loadingDislike: true };
    case "DISLIKE_SUCCESS":
      return {
        ...state,
        loadingDislike: false,
        post: { ...state.post, dislikes: action.payload.dislikes },
      };
    case "DISLIKE_FAIL":
      return { ...state, loadingDislike: false, dislikeError: action.payload };
    default:
      return state;
  }
};

const ForumDetail = () => {
  // Ref for comments
  const commentsRef = useRef();

  // State variables
  const [showFullText, setShowFullText] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [comment, setComment] = useState("");
  const [selectedImg, setSelectedImg] = useState("");

  // Context user info for global state
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;

  // Navigation hook
  const navigate = useNavigate();
  const params = useParams();
  const { postId } = params;

  //preview the image
  const handleImageClick = (img) => {
    setSelectedImg(img);
  };

  // Reducer hook
  const [
    { loading, error, post, loadingCreateComment, loadingLike, loadingDislike },
    dispatch,
  ] = useReducer(reducer, {
    post: [],
    loading: true,
    error: "",
  });

  // Fetch post data from the server
  useEffect(() => {
    const fetchPost = async () => {
      dispatch({ type: "FETCH_REQUEST" });
      try {
        const result = await axios.get(`/api/forum/${postId}`);
        console.log("API result:", result.data);
        dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        setSelectedImg(result.data.img);
      } catch (err) {
        console.error("API error:", err);
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };

    fetchPost();
  }, [
    postId,
    ctxDispatch,
    userInfo,
    loadingCreateComment,
    loadingLike,
    loadingDislike,
  ]);

  // Function to handle the edit comment form submission
  const handleEditComment = async (e) => {
    e.preventDefault();
    try {
      // Make API call to update the comment
      const { data } = await axios.put(
        `/api/forum/${postId}/comments/${editingComment._id}`,
        {
          comment: editedCommentText,
        },
        {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        }
      );

      // Update the post with the edited comment
      const updatedPost = {
        ...post,
        comments: post.comments.map((comment) =>
          comment._id === editingComment._id
            ? { ...comment, comment: editedCommentText }
            : comment
        ),
      };

      dispatch({ type: "FETCH_SUCCESS", payload: updatedPost });
      toast.success(data.message);
      setEditingComment(null); // Close the edit comment form
    } catch (err) {
      toast.error(getError(err));
    }
  };

  //define delete post handler
  const deletePost = async () => {
    if (window.confirm("Are you sure you want to delete?")) {
      try {
        //send ajax request
        await axios.delete(`/api/forum/${post._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success("Post deleted successfully!!");
        dispatch({ type: "DELETE_SUCCESS" });
        navigate(`/forum`);
      } catch (err) {
        toast.error(getError(error));
        dispatch({ type: "DELETE_FAIL" });
      }
    }
  };

  //delete comment handler
  const deleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        const { data } = await axios.delete(
          `/api/forum/${postId}/comments/${commentId}`,
          {
            headers: { Authorization: `Bearer ${userInfo?.token}` },
          }
        );

        // Update the post with the deleted comment removed
        const updatedPost = {
          ...post,
          comments: post.comments.filter(
            (comment) => comment._id !== commentId
          ),
        };

        dispatch({ type: "FETCH_SUCCESS", payload: updatedPost });
        toast.success(data.message);
      } catch (err) {
        toast.error(getError(err));
      }
    }
  };

  // define delete review button rendering
  const renderDeleteComment = (comment) => {
    if (userInfo) {
      if (userInfo.isAdmin) {
        // Admin can delete any comment
        return (
          <Button
            variant="danger"
            size="sm"
            className="delete-button"
            onClick={() => deleteComment(comment._id)}
          >
            {" "}
            <div className="fas fa-eraser"></div> Delete{" "}
            <strong style={{ color: "burlywood" }}>(Admin)</strong>
          </Button>
        );
      } else if (userInfo._id === comment.user?._id) {
        // User can delete their own review
        return (
          <Button
            variant="danger"
            size="sm"
            className="delete-button"
            onClick={() => deleteComment(comment._id)}
          >
            {" "}
            <div className="fas fa-eraser"></div> Delete
          </Button>
        );
      }
    }
    return null;
  };

  // JSX for the edit comment form
  const renderEditCommentForm = () => (
    <Form className="mt-2" onSubmit={handleEditComment}>
      <FloatingLabel controlId="editComment" label="Edit Comment">
        <Form.Control
          as="textarea"
          placeholder="Edit your comment here"
          value={editedCommentText}
          required
          onChange={(e) => setEditedCommentText(e.target.value)}
        />
      </FloatingLabel>
      <div className="mb-3 mt-2">
        <Button type="submit">Save</Button>
      </div>
    </Form>
  );

  // JSX for rendering the edit comment form
  const renderEditComment = (comment) => {
    if (userInfo && userInfo._id === comment.user?._id) {
      return (
        <>
          <Button
            variant="info"
            size="sm"
            style={{ marginLeft: "10px" }}
            onClick={() => setEditingComment(comment)}
          >
            <div className="fas fa-edit"></div> Edit
          </Button>
          {/* Render the edit comment form when editingComment is set */}
          {editingComment === comment && renderEditCommentForm()}
        </>
      );
    }
    return null;
  };

  // define delete review button rendering
  const renderDeletePost = (post) => {
    if (userInfo) {
      if (userInfo.isAdmin) {
        // Admin can delete any post
        return (
          <Button
            variant="danger"
            className="delete-button"
            onClick={() => deletePost(comment._id)}
          >
            <div className="fas fa-eraser"></div> Delete Post{" "}
            <strong style={{ color: "burlywood" }}>(Admin)</strong>
          </Button>
        );
      } else if (userInfo._id === post.user?._id) {
        // User can delete their own post
        return (
          <Button
            variant="danger"
            className="delete-button"
            onClick={() => deletePost(post._id)}
          >
            <div className="fas fa-eraser"></div> Delete Post
          </Button>
        );
      }
    }
    return null;
  };

  // Define user post name
  const renderUserPost = (post) => {
    if (post.user?._id && post.user.isAdmin) {
      // Display (Admin) for the post user who is an admin
      return (
        <strong>
          {post.user.name} <span style={{ color: "burlywood" }}>(Admin)</span>
        </strong>
      );
    } else if (post.user?._id) {
      // Display the logged-in user's name without (Admin)
      return <strong>{post.user.name}</strong>;
    }
    return null;
  };

  // Define edit review button rendering
  const renderEditPost = (post) => {
    if (userInfo && userInfo._id === post.user?._id) {
      // User can edit their own post
      return (
        <Button
          variant="success"
          onClick={() => navigate(`/forum/edit/${post._id}`)}
        >
          <div className="fas fa-edit"></div> Edit Post
        </Button>
      );
    }
    return null;
  };

  const handleLike = async () => {
    if (!userInfo) {
      toast.warning("Please sign in to like the post.");
      return;
    }

    try {
      dispatch({ type: "LIKE_REQUEST" });

      const { data } = await axios.post(
        `/api/forum/${postId}/toggle-like`,
        {},
        {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        }
      );

      // If the user disliked the post before, remove the dislike
      if (post.dislikes.some((dislike) => dislike.user === userInfo._id)) {
        dispatch({ type: "DISLIKE_SUCCESS", payload: data });
      }

      dispatch({ type: "LIKE_SUCCESS", payload: data });
    } catch (err) {
      dispatch({ type: "LIKE_FAIL", payload: getError(err) });
    }
  };

  const handleDislike = async () => {
    if (!userInfo) {
      toast.warning("Please sign in to dislike the post.");
      return;
    }

    try {
      dispatch({ type: "DISLIKE_REQUEST" });

      const { data } = await axios.post(
        `/api/forum/${postId}/toggle-dislike`,
        {},
        {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        }
      );

      // If the user liked the post before, remove the like
      if (post.likes.some((like) => like.user === userInfo._id)) {
        dispatch({ type: "LIKE_SUCCESS", payload: data });
      }

      dispatch({ type: "DISLIKE_SUCCESS", payload: data });
    } catch (err) {
      dispatch({ type: "DISLIKE_FAIL", payload: getError(err) });
    }
  };

  // Display the like and dislike buttons along with their counts
  const renderLikeDislikeButtons = () => {
    const userLiked =
      post.likes && post.likes.some((like) => like.user === userInfo?._id);
    const userDisliked =
      post.dislikes &&
      post.dislikes.some((dislike) => dislike.user === userInfo?._id);

    return (
      <div className="mb-3 mt-3">
        {/* Like */}
        <Button
          variant={`secondary ${userLiked ? "active" : ""}`}
          size="sm"
          style={{ marginRight: "10px" }}
          className={`like-button ${userLiked ? "active" : ""}`}
          onClick={handleLike}
          disabled={loadingLike}
        >
          {loadingLike ? (
            <Badge className="loading-box"></Badge>
          ) : (
            <div
              className={`fas fa-thumbs-up ${userLiked ? "active-icon" : ""}`}
            />
          )}{" "}
          Like{" "}
          {post.likes !== undefined && (
            <Badge bg="dark" pill className="count">
              {post.likes.length}
            </Badge>
          )}
        </Button>

        {/* Dislike */}
        <Button
          variant={`secondary ${userDisliked ? "active" : ""}`}
          size="sm"
          className={`dislike-button ${userDisliked ? "active" : ""}`}
          onClick={handleDislike}
          disabled={loadingDislike}
        >
          {loadingDislike ? (
            <Badge className="loading-box"></Badge>
          ) : (
            <div
              className={`fas fa-thumbs-down ${
                userDisliked ? "active-icon" : ""
              }`}
            />
          )}{" "}
          Dislike{" "}
          {post.dislikes !== undefined && (
            <Badge bg="dark" pill className="count">
              {post.dislikes.length}
            </Badge>
          )}
        </Button>
      </div>
    );
  };

  const submitComment = async (e) => {
    e.preventDefault();

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
      dispatch({ type: "CREATE_REQUEST" });

      const commentData = {
        comment,
        user: userInfo ? userInfo._id : null,
        avatar: userInfo ? userInfo._id : null,
      };

      if (userInfo) {
        commentData.name = userInfo.name;
      }

      // Make your API call to submit the comment
      const { data } = await axios.post(
        `/api/forum/${postId}/comments`,
        commentData,
        {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        }
      );

      // Update the post with the new comment
      const updatedPost = {
        ...post,
        comments: [...post.comments, data.comment],
      };

      dispatch({ type: "CREATE_SUCCESS" });
      toast.success(data.message);

      // Update the post in the state with the new comment
      dispatch({ type: "FETCH_SUCCESS", payload: updatedPost });
      setComment("");
    } catch (err) {
      dispatch({ type: "CREATE_FAIL" });
      toast.error(getError(err));
    }
  };

  return (
    <div style={{ marginTop: "10px" }}>
      {loading ? (
        <div className="loading-box" />
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div>
          <Helmet>
            <title>{post.user.name}'s Post</title>
          </Helmet>
          <Row className="mb-2 appear-animation">
            {/* Display post details here */}
            <Col xs={12}>
              <Card style={{ maxWidth: "100%" }}>
                <Card.Body>
                  <Row>
                    {/* Avatar and User Name Column */}
                    <Col
                      xs={8}
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <img
                        src={post.user.avatar}
                        alt="User Avatar"
                        style={{
                          marginRight: "8px",
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                        }}
                      />
                      <strong>{renderUserPost(post)}</strong>
                    </Col>
                    {/* Edit Button Column */}
                    <Col xs={4} className="text-end">
                      {renderEditPost(post)}
                      {renderDeletePost(post)}
                    </Col>
                  </Row>

                  <div>
                    <Col xs={12} className="text-center">
                      <Badge
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                        }}
                      >
                        <h4>{post.title}</h4>
                      </Badge>
                    </Col>
                    <p>
                      <strong style={{ color: "red" }}>Posted: </strong>
                      {post.createdAt.substring(0, 10)}
                    </p>
                  </div>

                  <div style={{ marginBottom: "15px", maxWidth: "100%" }}>
                    {/* Show more Post Text */}
                    <Card style={{ padding: "10px", maxWidth: "100%" }}>
                      {post.text.length > 100 ? (
                        <>
                          {showFullText ? (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(post.text),
                              }}
                            />
                          ) : (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(
                                  `${post.text
                                    .split(" ")
                                    .slice(0, 100)
                                    .join(" ")}...`
                                ),
                              }}
                            />
                          )}
                          <span
                            className="hoverable"
                            onClick={() => setShowFullText(!showFullText)}
                          >
                            {showFullText ? " Show Less" : " Show More"}
                          </span>
                        </>
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(post.text),
                          }}
                        />
                      )}
                    </Card>
                  </div>

                  {selectedImg && (
                    <img
                      className="mb-2 appear-animation"
                      src={selectedImg || post.img}
                      alt="Post"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                      }}
                      onClick={() => handleImageClick(selectedImg || post.img)}
                    />
                  )}

                  <Row style={{ maxWidth: "100vw", maxHeight: "20vw" }}>
                    {post.imgs &&
                      post.imgs.length > 0 &&
                      // Render the image section only if post.imgs is an array with elements
                      post.imgs.map((x, index) => (
                        <Col xs={12} key={index}>
                          <Card style={{ border: "none" }}>
                            <Button
                              className="thumbnail-card"
                              type="button"
                              variant="light"
                              style={{ maxWidth: "20vw" }}
                              onClick={() => setSelectedImg(x)}
                            >
                              <Card.Img
                                variant="top"
                                src={x}
                                alt={`post-${index}`}
                                className="appear-animation"
                              />
                            </Button>
                          </Card>
                        </Col>
                      ))}
                  </Row>

                  {/* Display the like and dislike buttons */}
                  {renderLikeDislikeButtons()}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Display comments section here */}
          <div className="my-3">
            <h2 ref={commentsRef}>Comments</h2>
            <div className="mb-3">
              {post.comments.length === 0 && (
                <div className="validation">There is no comments</div>
              )}
            </div>
            <div className="mb-3">
              {/* Display comments here for login users */}
              {userInfo && (
                <ListGroup>
                  {post.comments.map((comment) => (
                    <ListGroup.Item className="mb-3" key={comment._id}>
                      <div style={{ display: "flex", alignItems: "top" }}>
                        {/* Check if the comment has user information */}
                        {comment.user && comment.user.avatar ? (
                          <img
                            src={comment.user.avatar}
                            alt="User Avatar"
                            style={{
                              marginRight: "8px",
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          <img
                            src="https://res.cloudinary.com/ecomerce-shopping-reptiles/image/upload/v1700631306/reptile-icon-28_cbdviq.jpg"
                            alt="Default Avatar"
                            style={{
                              marginRight: "8px",
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                        <div>
                          <strong
                            style={{
                              fontSize:
                                userInfo && userInfo._id === comment.user?._id
                                  ? "18px"
                                  : "inherit",
                              color:
                                userInfo && userInfo._id === comment.user?._id
                                  ? "red"
                                  : "inherit",
                            }}
                          >
                            {userInfo && userInfo._id === comment.user?._id ? (
                              "You"
                            ) : comment.user && comment.user.isAdmin ? (
                              <span>
                                {comment.user.name}{" "}
                                <span style={{ color: "red" }}>(Admin)</span>
                              </span>
                            ) : comment.user && comment.user.name ? (
                              comment.user.name
                            ) : (
                              "Anonymous"
                            )}
                          </strong>

                          {comment.updatedAt === comment.createdAt ? (
                            <div
                              style={{
                                display: "flex",
                                color: "#949292",
                                filter: "blur(0.3px)",
                              }}
                            >
                              <strong>Posted:</strong>
                              <p>
                                {new Date(comment.createdAt).toLocaleDateString(
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
                                {new Date(comment.updatedAt).toLocaleDateString(
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

                          <p>{comment.comment}</p>
                          {renderDeleteComment(comment)}
                          {renderEditComment(comment)}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              {/* Display comments here for non-login users */}
              {!userInfo && (
                <ListGroup>
                  {post.comments.map((comment) => (
                    <ListGroup.Item className="mb-3" key={comment._id}>
                      <div style={{ display: "flex", alignItems: "top" }}>
                        {/* Check if the comment has user information */}
                        {comment.user && comment.user.avatar ? (
                          <img
                            src={comment.user.avatar}
                            alt="User Avatar"
                            style={{
                              marginRight: "8px",
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          <img
                            src="https://res.cloudinary.com/ecomerce-shopping-reptiles/image/upload/v1700631306/reptile-icon-28_cbdviq.jpg"
                            alt="Default Avatar"
                            style={{
                              marginRight: "8px",
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                        <div>
                          <strong
                            style={{
                              fontSize:
                                userInfo && userInfo._id === comment.user?._id
                                  ? "18px"
                                  : "inherit",
                              color:
                                userInfo && userInfo._id === comment.user?._id
                                  ? "red"
                                  : "inherit",
                            }}
                          >
                            {userInfo && userInfo._id === comment.user?._id ? (
                              "You"
                            ) : comment.user && comment.user.isAdmin ? (
                              <span>
                                {comment.user.name}{" "}
                                <span style={{ color: "red" }}>(Admin)</span>
                              </span>
                            ) : comment.user && comment.user.name ? (
                              comment.user.name
                            ) : (
                              "Anonymous"
                            )}
                          </strong>

                          {comment.createdAt && (
                            <p>
                              <strong>Posted: </strong>
                              {comment.createdAt.substring(0, 10)}
                            </p>
                          )}
                          <p>{comment.comment}</p>

                          {renderDeleteComment(comment)}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>

            {/* Display the comment form */}
            <div className="my-3">
              {userInfo ? (
                <form onSubmit={submitComment}>
                  <h2>Leave comment</h2>
                  <div className="mb-3">
                    <FloatingLabel controlId="floatingTextarea" label="Comment">
                      <Form.Control
                        as="textarea"
                        placeholder="Leave a comment here"
                        value={comment}
                        required
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </FloatingLabel>
                  </div>
                  <div className="mb-3">
                    <Button type="submit" disabled={loadingCreateComment}>
                      <div className="fas fa-comments"></div> Comment
                    </Button>
                    {loadingCreateComment && (
                      <div className="loading-box"></div>
                    )}
                  </div>
                </form>
              ) : (
                <div className="warning">
                  Please{" "}
                  <Link
                    style={{ paddingLeft: "5px", paddingRight: "5px" }}
                    to={`/signin?redirect=/forum/${post._id}`}
                  >
                    Sign In
                  </Link>{" "}
                  to comment
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumDetail;
