import React, { useEffect } from "react";
import { useContext } from "react";
import { useReducer } from "react";
import { Store } from "../Store";
import { getError } from "../utils";
import axios from "axios";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Chart from "react-google-charts";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Badge from "react-bootstrap/Badge";

// Define reducer to manage state changes
const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, summary: action.payload, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export default function DashboardScreen() {
  // Use reducer to manage state related to data fetching
  const [{ loading, summary, error }, dispatch] = useReducer(reducer, {
    loading: true,
    error: "",
  });

  // Get userInfo from global state
  const { state } = useContext(Store);
  const { userInfo } = state;

  // Fetch summary data using useEffect
  useEffect(() => {
    //send ajax request
    const fetchData = async () => {
      dispatch({ type: "FETCH_REQUEST" }); // Set loading state
      try {
        // Make API request to fetch summary data
        const { data } = await axios.get("/api/orders/summary", {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({
          type: "FETCH_FAIL",
          payload: getError(err),
        });
      }
    };
    fetchData();
  }, [userInfo]);

  // Render the dashboard contents
  return (
    <div style={{ paddingTop: "10px" }}>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <h1>
        <Badge bg="info">Dashboard</Badge>
      </h1>

      {/* Display loading, error, or dashboard content based on state */}
      {loading ? (
        <div className="loading-box" />
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          {/* Display various charts and statistics based on fetched summary data */}
          <Row>
            {/* Users */}
            <Col md={4}>
              <Link to="/admin/users" className="card-link">
                <Card>
                  <Card.Body>
                    <Card.Title>
                      {summary.users && summary.users[0]
                        ? summary.users[0].numUsers
                        : 0}
                    </Card.Title>
                    <Card.Text>Users</Card.Text>
                  </Card.Body>
                </Card>
              </Link>
            </Col>

            {/* Orders */}
            <Col md={4}>
              <Link to="/admin/orders" className="card-link">
                <Card>
                  <Card.Body>
                    <Card.Title>
                      {summary.orders && summary.orders[0]
                        ? summary.orders[0].numOrders
                        : 0}
                    </Card.Title>
                    <Card.Text>Orders</Card.Text>
                  </Card.Body>
                </Card>
              </Link>
            </Col>

            {/* Total Sales */}
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>
                    $
                    {summary.orders && summary.orders[0]
                      ? summary.orders[0].totalSales.toFixed(2)
                      : 0}
                  </Card.Title>
                  <Card.Text>Total Sales</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Sales Chart */}
          <div className="my-3">
            <h2>
              <Badge bg="info">Sales</Badge>
            </h2>
            {summary.dailyOrders.length === 0 ? (
              <div className="error">No Sale</div>
            ) : (
              <Chart
                chartType="LineChart"
                loader={
                  <div>
                    <div>Loading Chart...!!!</div>
                    <div className="loading-box" />
                  </div>
                }
                data={[
                  ["Date", "Sales ($)"],
                  ...summary.dailyOrders.map((x) => [
                    new Date(x._id).toLocaleDateString(),
                    x.sales,
                  ]),
                ]}
                options={{
                  hAxis: {
                    title: "Date",
                  },
                  pointSize: 8,
                }}
              />
            )}
          </div>

          {/* Products Sold Chart */}
          <div className="my-3">
            <h2>
              <Badge bg="info">Best Seller Product</Badge>
            </h2>
            {summary.productSold.length === 0 ? (
              <div className="error">No Product Sold</div>
            ) : (
              <Chart
                chartType="ColumnChart"
                loader={
                  <div>
                    <div>Loading Chart...!!!</div>
                    <div className="loading-box" />
                  </div>
                }
                data={[
                  ["Products", "Quantity Sold"],
                  ...summary.productSold.map((x) => [x.name, x.quantitySold]),
                ]}
                options={{
                  colors: ["#32a673"],
                }}
              />
            )}
          </div>

          {/* User Spending Chart */}
          <div className="my-3">
            <h2>
              <Badge bg="info">User Spending and Quantity Order</Badge>
            </h2>
            {summary.userSpending && summary.userSpending.length === 0 ? (
              <div className="error">No User Spending</div>
            ) : (
              <Chart
                chartType="Table"
                loader={
                  <div>
                    <div>Loading Chart...!!!</div>
                    <div className="loading-box" />
                  </div>
                }
                data={[
                  ["User", "Total Spending"],
                  ...(summary.userSpending || []).map((user) => [
                    user.name || "Unknown",
                    user.totalSpending + "$",
                  ]),
                ]}
                options={{
                  colors: ["#4285F4"],
                  hAxis: {
                    title: "User",
                  },
                }}
              />
            )}
          </div>

          {/* User Order Quantity */}
          <div className="my-3">
            {summary.userOrderQuantity.length === 0 ? (
              <div className="error">No User Orders</div>
            ) : (
              <Chart
                chartType="ColumnChart"
                loader={
                  <div>
                    <div>Loading Chart...!!!</div>
                    <div className="loading-box" />
                  </div>
                }
                data={[
                  ["User", "Quantity Ordered"],
                  ...summary.userOrderQuantity.map((x) => [
                    x.name || "Unknown",
                    x.quantityOrdered,
                  ]),
                ]}
                options={{
                  colors: ["#e0440e"],
                  hAxis: {
                    title: "User",
                  },
                }}
              />
            )}
          </div>

          {/* Categories Chart */}
          <div className="my-3">
            <h2>
              <Badge bg="info">Categories</Badge>
            </h2>
            {summary.productCategories.length === 0 ? (
              <div className="error">No Category</div>
            ) : (
              <Chart
                width="100%"
                height="400px"
                chartType="PieChart"
                loader={
                  <div>
                    <div>Loading Chart...!!!</div>
                    <div className="loading-box" />
                  </div>
                }
                data={[
                  ["Category", "Products"],
                  ...summary.productCategories.map((x) => [x._id, x.count]),
                ]}
              ></Chart>
            )}
          </div>
        </>
      )}
    </div>
  );
}
