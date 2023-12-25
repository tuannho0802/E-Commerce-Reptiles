import { useContext, useEffect, useReducer, useState } from "react";
import axios from "axios";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Forum from "../components/Forum";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { getError } from "../utils";
import { Helmet } from "react-helmet-async";

// Constants
const PAGE_SIZE = 6;

// Reducer function to manage state transitions
const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, posts: action.payload, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "CREATE_REQUEST":
      return { ...state, loadingCreate: true };
    case "CREATE_SUCCESS":
      return {
        ...state,
        loadingCreate: false,
      };
    case "CREATE_FAIL":
      return { ...state, loadingCreate: false };
    default:
      return state;
  }
};

function ReptileForum() {
  // Access global state
  const { state } = useContext(Store);
  const { userInfo } = state;

  // Initialize state variables using hooks
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(
    parseInt(localStorage.getItem("forumCurrentPage")) || 1
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState(
    localStorage.getItem("forumSortOption") || "newest"
  ); // Default sorting

  // Use reducer to manage complex state transitions
  const [{ loading, error, posts }, dispatch] = useReducer(reducer, {
    posts: [],
    loading: true,
    error: "",
  });

  // Function to handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      localStorage.setItem("forumCurrentPage", pageNumber);
    }
  };

  // Function to handle sort change
  const handleSortChange = (sortingOption) => {
    setSort(sortingOption);
    setCurrentPage(1);
    localStorage.setItem("forumCurrentPage", 1);
    localStorage.setItem("forumSortOption", sortingOption);
  };

  // Function to render page numbers
  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <Button
          className="m-1"
          key={i}
          variant={currentPage === i ? "dark" : "outline-dark"}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    return pageNumbers;
  };

  // useEffect to fetch data when component mounts or currentPage changes
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: "FETCH_REQUEST" });
      try {
        const result = await axios.get(`/api/forum?page=${currentPage}`);
        dispatch({ type: "FETCH_SUCCESS", payload: result.data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: err.message });
      }
    };
    fetchData();
  }, [currentPage]);

  // Clone and sort the posts based on the selected sorting option
  const sortedPosts = [...posts];

  // Sorting logic
  sortedPosts.sort((a, b) => {
    if (sort === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sort === "most-liked") {
      return b.likes.length - a.likes.length;
    } else if (sort === "most-disliked") {
      return b.dislikes.length - a.dislikes.length;
    } else {
      return 0;
    }
  });

  // Filter posts based on search term
  const filteredPosts = sortedPosts.filter(
    (post) =>
      post.user &&
      post.title &&
      (post.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate total pages for pagination
  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);

  // Extract visible posts based on current page
  const visiblePosts = filteredPosts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Function to handle post creation
  const createHandler = async () => {
    if (window.confirm("Are you sure you want to create?")) {
      try {
        dispatch({ type: "CREATE_REQUEST" });
        const { data } = await axios.post(
          "/api/forum",
          {},
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }
        );
        toast.success("Post created successfully!!");
        dispatch({ type: "CREATE_SUCCESS" });
        navigate(`/forum/edit/${data.post._id}`);
      } catch (err) {
        toast.error(getError(error));
        dispatch({ type: "CREATE_FAIL" });
      }
    }
  };

  return (
    <div>
      <Helmet>
        <title>Forum</title>
      </Helmet>
      <h1>New Posts</h1>
      <div>
        {/* Search and Create Post */}
        <div>
          <Form className="d-flex me-auto mb-3">
            <InputGroup>
              <FormControl
                style={{ maxWidth: "50rem" }}
                type="text"
                name="q"
                id="q"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Posts..."
              />
            </InputGroup>
          </Form>
        </div>
        <Button className="mb-3" variant="primary" onClick={createHandler}>
          Create Post
        </Button>
      </div>

      {/* Sort posts */}
      <div>
        <Form.Select
          aria-label="Sort By"
          style={{ maxWidth: "12vw" }}
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="newest">Newest Arrived</option>
          <option value="most-liked">Most Liked</option>
          <option value="most-disliked">Most Disliked</option>
        </Form.Select>
      </div>

      <div className="posts">
        {loading ? (
          <div className="loading-box" />
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div>
            <Col>
              {visiblePosts.map((post) => (
                <Row
                  key={post._id}
                  className="mt-2 forum-row"
                  onClick={() => navigate(`/forum/${post._id}`)}
                >
                  <Forum post={post}></Forum>
                </Row>
              ))}
            </Col>
            <div>
              <Button
                variant="dark"
                className="m-1"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fas fa-arrow-alt-circle-left" />
              </Button>
              {renderPageNumbers()}
              <Button
                variant="dark"
                className="m-1"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-arrow-alt-circle-right" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReptileForum;
