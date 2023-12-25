import React, { useContext, useEffect, useReducer, useState } from "react";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Badge from "react-bootstrap/Badge";
import { Store } from "../Store";
import { getError } from "../utils";

// Initial state for the component
const initialState = {
  sortColumn: "name",
  sortOrder: "asc",
  loading: true,
  error: "",
  users: [],
  loadingDelete: false,
  successDelete: false,
};

// Reducer function to manage component state
const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        users: action.payload,
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
    case "SORT_USERS":
      return {
        ...state,
        sortColumn: action.payload.column || "name",
        sortOrder: action.payload.order || "asc",
      };
    default:
      return state;
  }
};

export default function UserListScreen() {
  const navigate = useNavigate();

  // useReducer for managing component state
  const [
    {
      loading,
      error,
      users,
      loadingDelete,
      successDelete,
      sortColumn,
      sortOrder,
    },
    dispatch,
  ] = useReducer(reducer, initialState);

  // Context API hook to access global state
  const { state } = useContext(Store);
  const { userInfo } = state;

  // Local state to manage sorting
  const [sorting, setSorting] = useState(false);

  // Fetch user data from the backend
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: "FETCH_REQUEST" });
      try {
        const { data } = await axios.get("/api/users", {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        // Sort users based on the selected column and order
        const sortedUsers = data.slice().sort((a, b) => {
          const userA = a[sortColumn];
          const userB = b[sortColumn];

          // Assuming all sortable columns are strings or numbers
          if (sortOrder === "asc") {
            return userA > userB ? 1 : -1;
          } else {
            return userA < userB ? 1 : -1;
          }
        });

        dispatch({ type: "FETCH_SUCCESS", payload: sortedUsers });
      } catch (err) {
        dispatch({
          type: "FETCH_FAIL",
          payload: getError(err),
        });
      }
    };

    fetchData();
  }, [userInfo, successDelete, sortColumn, sortOrder]);

  // Handler for deleting a user
  const deleteHandler = async (user) => {
    if (window.confirm("Are you sure to delete?")) {
      try {
        dispatch({ type: "DELETE_REQUEST" });
        await axios.delete(`/api/users/${user._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success("User deleted successfully!!");
        dispatch({ type: "DELETE_SUCCESS" });
      } catch (err) {
        toast.error(getError(err));
        dispatch({ type: "DELETE_FAIL" });
      }
    }
  };

  // Handler for sorting users based on a column
  const handleSort = (column) => {
    if (sorting) {
      return;
    }

    const newOrder =
      column === sortColumn && sortOrder === "asc" ? "desc" : "asc";

    setSorting(true);

    dispatch({
      type: "SORT_USERS",
      payload: { column, order: newOrder },
    });

    // Reset sorting flag after a short delay
    setTimeout(() => {
      setSorting(false);
    }, 500);
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <Helmet>
        <title>Users</title>
      </Helmet>
      <h1>
        <Badge bg="info">Users</Badge>
      </h1>

      {loadingDelete && <div className="loading-box" />}
      {loading ? (
        <div className="loading-box" />
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="table-container">
            {" "}
            <table
              className="table"
              style={{
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                backgroundColor: "linear-gradient(to bottom, #893b3b, #efb65b)",
              }}
            >
              <thead>
                <tr>
                  <th>AVATAR</th>
                  <th onClick={() => handleSort("name")}>
                    NAME{" "}
                    {sortColumn === "name" && (
                      <span className={`arrow ${sortOrder}`}>&#9660;</span>
                    )}
                  </th>
                  <th onClick={() => handleSort("email")}>
                    EMAIL{" "}
                    {sortColumn === "email" && (
                      <span className={`arrow ${sortOrder}`}>&#9660;</span>
                    )}
                  </th>
                  <th onClick={() => handleSort("isAdmin")}>
                    ROLE{" "}
                    {sortColumn === "isAdmin" && (
                      <span className={`arrow ${sortOrder}`}>&#9660;</span>
                    )}
                  </th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="img-fluid img-thumbnail"
                        style={{ borderRadius: "50%" }}
                      />
                    </td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td
                      style={{
                        fontWeight: "bold",
                        color: user.isAdmin ? "green" : "blue",
                      }}
                    >
                      {user.isAdmin ? "ADMIN" : "USER"}
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant="success"
                        onClick={() => navigate(`/admin/user/${user._id}`)}
                      >
                        Edit
                      </Button>
                      &nbsp;
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => deleteHandler(user)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
