import React, { useContext } from "react";
import { ToastContainer } from "react-toastify";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import { Store } from "../Store";
import Container from "react-bootstrap/Container";
import { LinkContainer } from "react-router-bootstrap";
import SearchBox from "./SearchBox";
import { Link, NavLink } from "react-router-dom";
import Badge from "react-bootstrap/Badge";

export default function Header() {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, userInfo } = state;

  const signoutHandler = () => {
    // Display span confirmation dialog
    const isConfirmed = window.confirm("Are you sure you want to sign out?");

    // If the user confirms, proceed with sign-out
    if (isConfirmed) {
      ctxDispatch({ type: "USER_SIGNOUT" });
      localStorage.removeItem("userInfo");
      localStorage.removeItem("shippingAddress");
      localStorage.removeItem("paymentMethod");
      window.location.href = "/signin";
    }
  };

  return (
    <div style={{ zIndex: "1" }}>
      <ToastContainer position="bottom-center" limit={1} />
      <header>
        <Navbar
          fixed="top"
          className="nav-header"
          bg="dark"
          variant="dark"
          expand="md"
        >
          <Container>
            <NavLink
              to="/"
              className="shop-title"
              activeclassname="active-shop-title"
            >
              <div className="fas fa-home"> Reptiles</div>
            </NavLink>

            <NavLink
              to="/forum"
              className="shop-title"
              activeclassname="active-shop-title"
            >
              <div className="fas fa-blog"> Forum</div>
            </NavLink>

            <SearchBox />

            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto w-100 justify-content-end">
                {/* Link Cart */}
                <Link className="nav-link" to="/cart">
                  <div className="fas fa-shopping-cart"></div> Cart
                  {cart.cartItems.length > 0 && (
                    <Badge pill bg="danger">
                      {cart.cartItems.reduce((span, c) => span + c.quantity, 0)}
                    </Badge>
                  )}
                </Link>

                {userInfo ? (
                  <NavDropdown
                    title={
                      <span>
                        <div className="fas fa-user-cog"></div> {userInfo.name}
                      </span>
                    }
                    className="nav-dropdown"
                    id="basic-nav-dropdown"
                  >
                    <LinkContainer to="/profile">
                      <NavDropdown.Item className="signin-drop">
                        <div className="fas fa-user"></div> User Profile
                      </NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to="/mine/orders">
                      <NavDropdown.Item className="signin-drop">
                        <div className="fas fa-receipt"></div> Order History
                      </NavDropdown.Item>
                    </LinkContainer>
                    <NavDropdown.Divider />
                    <Link
                      className="dropdown-item"
                      to="#signout"
                      onClick={signoutHandler}
                    >
                      <div className="fas fa-sign-out-alt"> </div> Sign Out
                    </Link>
                  </NavDropdown>
                ) : (
                  <Link className="nav-link" to="/signin">
                    <div className="fas fa-sign-in-alt"></div> Sign In
                  </Link>
                )}

                {userInfo && userInfo.isAdmin && (
                  <NavDropdown
                    title={
                      <span>
                        <div className="fas fa-users-cog"></div> Admin
                      </span>
                    }
                    className="custom-nav-dropdown"
                    id="admin-nav-drop-down"
                  >
                    <LinkContainer to="/admin/dashboard">
                      <NavDropdown.Item>
                        <div className="fas fa-chart-line" /> Dashboard
                      </NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to="/admin/products">
                      <NavDropdown.Item>
                        <div className="fas fa-otter" /> Products
                      </NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to="/admin/orders">
                      <NavDropdown.Item>
                        <div className="fas fa-list-alt" /> Orders
                      </NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to="/admin/users">
                      <NavDropdown.Item>
                        <div className="fas fa-users" /> Users
                      </NavDropdown.Item>
                    </LinkContainer>
                  </NavDropdown>
                )}
              </Nav>
            </Navbar.Collapse>
            {userInfo && (
              <Link to="/profile">
                <div>
                  <img
                    className="avatar-hover"
                    src={userInfo.avatar}
                    alt=""
                  ></img>
                </div>
              </Link>
            )}
          </Container>
        </Navbar>
      </header>
    </div>
  );
}
