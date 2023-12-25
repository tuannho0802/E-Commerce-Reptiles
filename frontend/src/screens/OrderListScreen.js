import React, { useContext, useEffect, useReducer, useState } from "react";
import { Store } from "../Store";
import axios from "axios";
import { getError } from "../utils";
import { Helmet } from "react-helmet-async";
import Button from "react-bootstrap/Button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Badge from "react-bootstrap/Badge";

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
export default function OrderListScreen() {
  const navigate = useNavigate();
  //define pagination
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const page = sp.get("page") || 1;

  // Get user info from the global state
  const { state } = useContext(Store);
  const { userInfo } = state;

  //define useReducer
  const [
    {
      loading,
      error,
      orders,
      pages,
      loadingDelete,
      successDelete,
      sortColumn,
      sortOrder,
    },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    error: "",
    sortColumn: "createdAt",
    sortOrder: "desc",
  });

  //track state
  const [sorting, setSorting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        // send ajax request with the correct pagination query parameter
        const { data } = await axios.get(`/api/orders/admin?page=${page}`, {
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

        dispatch({
          type: "FETCH_SUCCESS",
          payload: { orders: sortedOrders, page: data.page, pages: data.pages },
        });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    // check
    if (successDelete) {
      dispatch({ type: "DELETE_RESET" });
    } else {
      fetchData();
    }
  }, [userInfo, successDelete, page, sortColumn, sortOrder]);

  // Define handlers for sorting
  const handleSort = (column) => {
    if (sorting) {
      return;
    }

    console.log("Sorting by column:", column);

    const newOrder =
      column === sortColumn && sortOrder === "asc" ? "desc" : "asc";

    setSorting(true);

    if (column === "user.name") {
      dispatch({
        type: "SORT_USERS",
        payload: { column, order: newOrder },
      });
    } else {
      dispatch({
        type: "SORT_ORDERS",
        payload: { column, order: newOrder },
      });
    }

    setTimeout(() => {
      setSorting(false);
    }, 500);
  };

  //define deleteHandler
  const deleteHandler = async (order) => {
    //check
    if (window.confirm("Are you sure you want to delete?")) {
      //send ajax request
      try {
        dispatch({ type: "DELETE_REQUEST" });
        await axios.delete(`/api/orders/${order._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success("Order deleted successfully!!");
        dispatch({ type: "DELETE_SUCCESS" });
      } catch (err) {
        toast.error(getError(error));
        dispatch({
          type: "DELETE_FAIL",
        });
      }
    }
  };

  return (
    <div style={{ paddingTop: "10px" }}>
      <Helmet>
        <title>Orders Management</title>
      </Helmet>
      <h1>
        <Badge bg="info">Orders Management</Badge>
      </h1>
      {/* Conditional render */}
      {loadingDelete && <div className="loading-box" />}
      {loading ? (
        <div className="loading-box" />
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="table-container">
            <table
              className="table  appear-animation"
              style={{
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <thead>
                <tr>
                  <th>Number</th>
                  <th>ID</th>
                  <th>USER</th>

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
                    <td>{index + 1}</td>
                    <td
                      style={{
                        maxWidth: "60px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {order._id}
                    </td>

                    <td>{order.user ? order.user.name : "DELETED USER"}</td>
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
                        variant="light"
                        style={{ color: "#fff", background: "#1ec71e" }}
                        onClick={() => {
                          navigate(`/order/${order._id}`);
                        }}
                      >
                        Details
                      </Button>
                      &nbsp;
                      <Button
                        type="button"
                        variant="light"
                        style={{ color: "#fff", background: "red" }}
                        onClick={() => deleteHandler(order)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Pagination */}
            </table>
            <div>
              {[...Array(pages).keys()].map((x) => (
                <Link
                  className={
                    x + 1 === Number(page) ? "btn text-bold btn-pagi" : "btn"
                  }
                  key={x + 1}
                  to={`/admin/orders?page=${x + 1}`}
                  style={{ marginLeft: "10px" }}
                >
                  {x + 1}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
