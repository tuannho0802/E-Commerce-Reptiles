import React, { useContext, useEffect, useReducer, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Store } from "../Store";
import { Helmet } from "react-helmet-async";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { toast } from "react-toastify";
import { getError } from "../utils";
import Badge from "react-bootstrap/Badge";

// Initial state for the reducer
const initialState = {
  sortColumn: "createdAt",
  sortOrder: "desc",
  loading: true,
  error: "",
  products: [],
  pages: 1,
  loadingCreate: false,
  loadingDelete: false,
  successDelete: false,
};

// Reducer function to manage state transitions
const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        products: action.payload.products,
        pages: action.payload.pages,
        loading: false,
      };
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
    case "DELETE_REQUEST":
      return { ...state, loadingDelete: true, successDelete: false };
    case "DELETE_SUCCESS":
      return {
        ...state,
        loadingDelete: false,
        successDelete: true,
      };
    case "DELETE_FAIL":
      return { ...state, loadingDelete: false };
    case "DELETE_RESET":
      return { ...state, loadingDelete: false, successDelete: false };
    case "SORT_PRODUCTS":
      return {
        ...state,
        sortColumn: action.payload.column || "createdAt",
        sortOrder: action.payload.order || "desc",
      };
    default:
      return state;
  }
};

// use reducer
export default function ProductListScreen() {
  // Use reducer hook to manage complex state logic
  const [
    {
      loading,
      error,
      products,
      pages,
      sortColumn,
      sortOrder,
      loadingCreate,
      loadingDelete,
      successDelete,
    },
    dispatch,
  ] = useReducer(reducer, initialState);

  const navigate = useNavigate();

  // useLocation for pagination
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const page = sp.get("page") || 1;

  // get userInfo from global state
  const { state } = useContext(Store);
  const { userInfo } = state;

  // State to track sorting state
  const [sorting, setSorting] = useState(false);

  // Fetch data using useEffect
  useEffect(() => {
    // send ajax request
    const fetchData = async () => {
      dispatch({ type: "FETCH_REQUEST" });
      try {
        // Fetch products from the backend
        const { data } = await axios.get(`/api/products/admin?page=${page}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        // Sorting logic
        const sortedProducts = data.products.slice().sort((a, b) => {
          const productA = a[sortColumn];
          const productB = b[sortColumn];

          // Assuming all sortable columns are strings or numbers
          if (sortOrder === "asc") {
            return productA > productB ? 1 : -1;
          } else {
            return productA < productB ? 1 : -1;
          }
        });

        dispatch({
          type: "FETCH_SUCCESS",
          payload: { products: sortedProducts, pages: data.pages },
        });
      } catch (error) {
        dispatch({
          type: "FETCH_FAIL",
          payload: getError(error),
        });
      }
    };

    fetchData();
  }, [userInfo, page, sortColumn, sortOrder, successDelete]);

  // Function to handle sorting by column
  const handleSort = (column) => {
    if (sorting) {
      // If sorting is already in progress, ignore the click
      return;
    }

    console.log("Sorting by column:", column);

    const newOrder =
      column === sortColumn && sortOrder === "asc" ? "desc" : "asc";

    // Set sorting to true to indicate sorting is in progress
    setSorting(true);

    dispatch({
      type: "SORT_PRODUCTS",
      payload: { column, order: newOrder },
    });

    // Reset sorting state to false after a short delay
    setTimeout(() => {
      setSorting(false);
    }, 500);
  };

  // Function to handle product creation
  const createHandler = async () => {
    if (window.confirm("Are you sure you want to create?")) {
      try {
        dispatch({ type: "CREATE_REQUEST" });
        // send ajax request
        const { data } = await axios.post(
          "/api/products",
          {},
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }
        );
        toast.success("Product created successfully!!");
        dispatch({ type: "CREATE_SUCCESS" });
        navigate(`/admin/product/${data.product._id}`);
      } catch (err) {
        toast.error(getError(error));
        dispatch({ type: "CREATE_FAIL" });
      }
    }
  };

  // Function to handle product deletion
  const deleteHandler = async (product) => {
    if (window.confirm("Are you sure you want to delete?")) {
      try {
        // send ajax request
        await axios.delete(`/api/products/${product._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success("Product deleted successfully!!");
        dispatch({ type: "DELETE_SUCCESS" });
      } catch (err) {
        toast.error(getError(error));
        dispatch({ type: "DELETE_FAIL" });
      }
    }
  };

  return (
    <div style={{ paddingTop: "10px" }}>
      <Helmet>
        <title>Products Manage</title>
      </Helmet>
      <Row>
        <Col>
          <h1>
            <Badge bg="info">Products</Badge>
          </h1>
        </Col>
        <Col className="col text-end">
          <div>
            <Button type="button" onClick={createHandler}>
              Create Product
            </Button>
          </div>
        </Col>
      </Row>

      {loadingCreate && <div className="loading-box" />}
      {loadingDelete && <div className="loading-box" />}

      {loading ? (
        <div className="loading-box" />
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="table-container">
            <table
              className="table"
              style={{ boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" }}
            >
              <thead>
                <tr>
                  <th>Number</th>
                  <th onClick={() => handleSort("name")}>
                    NAME{" "}
                    {sortColumn === "name" && (
                      <span className={`arrow ${sortOrder}`}>&#9660;</span>
                    )}
                  </th>
                  <th>THUMBNAIL</th>
                  <th onClick={() => handleSort("countInStock")}>
                    QUANTITY{" "}
                    {sortColumn === "countInStock" && (
                      <span className={`arrow ${sortOrder}`}>&#9660;</span>
                    )}
                  </th>
                  <th onClick={() => handleSort("price")}>
                    PRICE{" "}
                    {sortColumn === "price" && (
                      <span className={`arrow ${sortOrder}`}>&#9660;</span>
                    )}
                  </th>
                  <th onClick={() => handleSort("category")}>
                    CATEGORY{" "}
                    {sortColumn === "category" && (
                      <span className={`arrow ${sortOrder}`}>&#9660;</span>
                    )}
                  </th>
                  <th onClick={() => handleSort("country")}>
                    COUNTRY{" "}
                    {sortColumn === "country" && (
                      <span className={`arrow ${sortOrder}`}>&#9660;</span>
                    )}
                  </th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product._id}>
                    <td>{index + 1}</td>
                    <td>
                      <Link to={`/product/${product.slug}`}>
                        {product.name}
                      </Link>
                    </td>
                    <td>
                      <Link
                        className="thumbnail-card"
                        to={`/product/${product.slug}`}
                      >
                        <img
                          src={product.img}
                          alt={product.name}
                          className="img-fluid rounded img-thumbnail "
                        />
                      </Link>
                    </td>
                    <td
                      style={{
                        color: product.countInStock === 0 ? "red" : "green",
                        fontWeight: "bold",
                      }}
                    >
                      {product.countInStock}
                    </td>
                    <td>${product.price}</td>
                    <td>{product.category}</td>
                    <td>{product.country}</td>
                    <td>
                      <Button
                        type="button"
                        variant="success"
                        onClick={() =>
                          navigate(`/admin/product/${product._id}`)
                        }
                      >
                        Edit
                      </Button>
                      &nbsp;
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => deleteHandler(product)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            {[...Array(pages).keys()].map((x) => (
              <Link
                className={
                  x + 1 === Number(page) ? "btn text-bold btn-pagi" : "btn"
                }
                key={x + 1}
                to={`/admin/products?page=${x + 1}`}
                style={{ marginLeft: "10px" }}
              >
                {x + 1}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
