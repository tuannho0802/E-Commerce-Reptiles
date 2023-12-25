import React, { useContext, useEffect, useReducer, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Store } from "../Store";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getError } from "../utils";
import axios from "axios";
import Button from "react-bootstrap/Button";

// Initial state for the reducer
const initialState = {
  sortColumn: "createdAt",
  sortOrder: "desc",
  loading: true,
  error: "",
  orders: [],
  page: 1,
  pages: 1,
};

// Reducer function to manage state during data fetching
const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        orders: action.payload.orders,
        page: action.payload.page,
        pages: action.payload.pages,
        loading: false,
      };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "SORT_ORDERS":
      return {
        ...state,
        sortColumn: action.payload.column || "createdAt", // default to "createdAt"
        sortOrder: action.payload.order || "desc", // default to "desc"
      };
    default:
      return state;
  }
};

export default function OrderHistoryScreen() {
  // Get user info from the global state
  const { state } = useContext(Store);
  const { userInfo } = state;

  // Define pagination
  const navigate = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const page = sp.get("page") || 1;

  // Use reducer to manage state and actions
  const [{ loading, error, orders, pages, sortColumn, sortOrder }, dispatch] =
    useReducer(reducer, initialState);

  // Track sorting state
  const [sorting, setSorting] = useState(false);

  // Define useEffect to fetch data
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: "FETCH_REQUEST" });
      try {
        const { data } = await axios.get(`/api/orders/mine?page=${page}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        // Sorting logic
        const sortedOrders = data.orders.slice().sort((a, b) => {
          const orderA = a[sortColumn];
          const orderB = b[sortColumn];

          // Convert date strings to Date objects for proper comparison
          const dateA = new Date(orderA);
          const dateB = new Date(orderB);

          if (sortOrder === "asc") {
            return dateA > dateB ? 1 : -1;
          } else {
            return dateA < dateB ? 1 : -1;
          }
        });

        console.log("Sorted Orders:", sortedOrders);

        dispatch({
          type: "FETCH_SUCCESS",
          payload: { orders: sortedOrders, page: data.page, pages: data.pages },
        });
      } catch (error) {
        dispatch({
          type: "FETCH_FAIL",
          payload: getError(error),
        });
      }
    };

    fetchData();
  }, [userInfo, page, sortColumn, sortOrder]);

  // Handle sorting of orders based on the selected column
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
      type: "SORT_ORDERS",
      payload: { column, order: newOrder },
    });

    // Reset sorting state to false after a short delay
    setTimeout(() => {
      setSorting(false);
    }, 500);
  };

  return (
    <div>
      <Helmet>Order History</Helmet>
      <h1>Order History</h1>
      {/* Conditional render */}
      {loading ? (
        <div className="loading-box" />
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="table-container">
            <table
              className="table appear-animation"
              style={{
                width: "100%",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <thead>
                <tr>
                  <th>Number</th>
                  <th>ID</th>
                  <th onClick={() => handleSort("createdAt")}>
                    DATE{" "}
                    {sortColumn === "createdAt" && (
                      <span className={`arrow ${sortOrder}`}>&#9660;</span>
                    )}
                  </th>
                  <th onClick={() => handleSort("totalPrice")}>
                    TOTAL{" "}
                    {sortColumn === "totalPrice" && (
                      <span className={`arrow ${sortOrder}`}>&#9660;</span>
                    )}
                  </th>
                  <th onClick={() => handleSort("isPaid")}>
                    PAID{" "}
                    {sortColumn === "isPaid" && (
                      <span className={`arrow ${sortOrder}`}>&#9660;</span>
                    )}
                  </th>
                  <th onClick={() => handleSort("isDelivered")}>
                    DELIVERED{" "}
                    {sortColumn === "isDelivered" && (
                      <span className={`arrow ${sortOrder}`}>&#9660;</span>
                    )}
                  </th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order, index) => (
                  <tr key={order._id}>
                    <td style={{ width: "1em" }}>{index + 1}</td>
                    <td
                      style={{
                        maxWidth: "40px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {order._id}
                    </td>
                    <td>{order.createdAt.substring(0, 10)}</td>
                    <td>${order.totalPrice.toFixed(2)}</td>
                    <td
                      style={{
                        fontWeight: "bold",
                        color: order.isPaid ? "green" : "red",
                      }}
                    >
                      {order.isPaid ? order.paidAt.substring(0, 10) : "No"}
                    </td>
                    <td
                      style={{
                        fontWeight: "bold",
                        color: order.isDelivered ? "green" : "red",
                      }}
                    >
                      {order.isDelivered
                        ? order.deliveredAt.substring(0, 10)
                        : "No"}
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant="success"
                        onClick={() => {
                          navigate(`/order/${order._id}`);
                        }}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div>
            {[...Array(pages).keys()].map((x) => (
              <Link
                className={
                  x + 1 === Number(page) ? "btn text-bold btn-pagi" : "btn"
                }
                key={x + 1}
                to={`/mine/orders?page=${x + 1}`}
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
