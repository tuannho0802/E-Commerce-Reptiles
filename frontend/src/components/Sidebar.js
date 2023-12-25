import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getError } from "../utils";
import {
  Sidebar,
  Menu,
  MenuItem,
  SubMenu,
  sidebarClasses,
  menuClasses,
} from "react-pro-sidebar";
import { LinkContainer } from "react-router-bootstrap";
import Nav from "react-bootstrap/Nav";
import { Link } from "react-router-dom";
import { Store } from "../Store";

export default function MySidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [scroll, setScroll] = useState(false);
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;

  // define and set categories, countries
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);

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

  const signinHandler = () => {
    if (userInfo) {
      toast.warning("You've already Sign In!!");
    } else {
      window.location.href = "/signin";
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get(`/api/products/categories`);
        setCategories(data);
      } catch (err) {
        toast.error(getError(err));
      }
    };
    fetchCategories();

    const fetchCountries = async () => {
      try {
        const { data } = await axios.get(`/api/products/countries`);
        setCountries(data);
      } catch (err) {
        toast.error(getError(err));
      }
    };
    fetchCountries();

    // Check if the sidebar is collapsed in localStorage
    const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
    setCollapsed(isCollapsed);
  }, []);

  const handleSidebarCollapse = () => {
    setCollapsed(!collapsed);
    // Store the state of the sidebar in localStorage
    localStorage.setItem("sidebarCollapsed", String(!collapsed));
  };

  //copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied to clipboard: ${text}`);
    } catch (err) {
      toast.error("Failed to copy text: ", err);
    }
  };

  // useEffect(() => {
  //   const handleScroll = () => {
  //     const delay = 200;
  //     let timeout;

  //     if (timeout) {
  //       clearTimeout(timeout);
  //     }

  //     timeout = setTimeout(() => {
  //       const shouldCollapse = window.scrollY > 100;
  //       setScroll(shouldCollapse);
  //     }, delay);
  //   };

  //   window.addEventListener("scroll", handleScroll);

  //   return () => {
  //     window.removeEventListener("scroll", handleScroll);
  //   };
  // }, []);

  return (
    <div className={`fixed-sidebar ${scroll ? "collapsed" : ""}`}>
      <Sidebar
        rootStyles={{
          [`.${sidebarClasses.container}`]: {
            background:
              "linear-gradient(45deg, rgba(54,199,201,1) 0%, rgba(112,186,202,1) 38%, rgba(140,194,229,1) 63%, rgba(137,125,197,1) 100%)",
          },
        }}
        transitionDuration={500}
        collapsed={collapsed}
      >
        <Menu>
          <MenuItem
            onClick={handleSidebarCollapse}
            style={{ textAlign: "center" }}
            icon={<i className="fas fa-bars" />}
          ></MenuItem>
        </Menu>

        <Menu
          transitionDuration={500}
          rootStyles={{
            background:
              "linear-gradient(276deg, rgba(54,199,201,1) 0%, rgba(71,109,212,1) 25%, rgba(173,212,94,1) 75%, rgba(215,174,88,1) 100%)",
          }}
          collapsed={collapsed}
        >
          {/* Home */}
          <MenuItem component={<Link to="/" />}>
            <div className="fas fa-home" /> Home
          </MenuItem>

          {/* Forum */}
          <MenuItem component={<Link to="/forum" />}>
            <div className="fas fa-blog" /> Forum
          </MenuItem>

          {/* Order History */}
          <MenuItem component={<Link to="/mine/orders" />}>
            <div className="fas fa-receipt"></div> Order History
          </MenuItem>

          {/* Sign Out */}
          <MenuItem component={<Link to="#signout" onClick={signoutHandler} />}>
            <div className="fas fa-sign-out-alt"> </div> Sign Out
          </MenuItem>

          {/* Sign In */}
          <MenuItem component={<Link to="#signin" onClick={signinHandler} />}>
            <div className="fas fa-sign-in-alt"></div> Sign In
          </MenuItem>

          {/* Categories */}
          <SubMenu
            label="Categories"
            icon={<strong className="fas fa-frog"></strong>}
            rootStyles={{
              ["& > ." + menuClasses.button]: {
                backgroundColor:
                  "linear-gradient(276deg, rgba(54,199,201,1) 0%, rgba(71,109,212,1) 25%, rgba(173,212,94,1) 75%, rgba(215,174,88,1) 100%)",

                "&:hover": {
                  backgroundColor:
                    "linear-gradient(261deg, rgba(2,0,36,1) 0%, rgba(36,36,87,1) 35%, rgba(0,212,255,1) 100%)",
                },
              },
              ["." + menuClasses.subMenuContent]: {
                background:
                  "linear-gradient(38deg, rgba(2,0,36,1) 0%, rgba(54,54,137,1) 35%, rgba(0,212,255,1) 100%)",
              },
            }}
          >
            {categories.map((category) => (
              <MenuItem key={category}>
                {" "}
                <LinkContainer
                  to={{
                    pathname: "/search",
                    search: `?category=${category}`,
                  }}
                >
                  <Nav.Link>{category}</Nav.Link>
                </LinkContainer>
              </MenuItem>
            ))}
          </SubMenu>

          {/* Countries */}
          <SubMenu
            label="Countries"
            icon={<i className="fas fa-globe"></i>}
            rootStyles={{
              ["& > ." + menuClasses.button]: {
                backgroundColor:
                  "linear-gradient(276deg, rgba(54,199,201,1) 0%, rgba(71,109,212,1) 25%, rgba(173,212,94,1) 75%, rgba(215,174,88,1) 100%)",

                "&:hover": {
                  backgroundColor:
                    "linear-gradient(261deg, rgba(2,0,36,1) 0%, rgba(36,36,87,1) 35%, rgba(0,212,255,1) 100%)",
                },
              },
              ["." + menuClasses.subMenuContent]: {
                background:
                  "linear-gradient(38deg, rgba(2,0,36,1) 0%, rgba(54,54,137,1) 35%, rgba(0,212,255,1) 100%)",
              },
            }}
          >
            {countries.map((country) => (
              <MenuItem key={country}>
                {" "}
                <LinkContainer
                  to={{
                    pathname: "/search",
                    search: `?country=${country}`,
                  }}
                >
                  <Nav.Link>{country}</Nav.Link>
                </LinkContainer>
              </MenuItem>
            ))}
          </SubMenu>

          {/* Location */}
          <SubMenu
            label="Store Location"
            icon={<i className="fas fa-map-marker-alt"></i>}
            rootStyles={{
              ["& > ." + menuClasses.button]: {
                backgroundColor:
                  "linear-gradient(276deg, rgba(54,199,201,1) 0%, rgba(71,109,212,1) 25%, rgba(173,212,94,1) 75%, rgba(215,174,88,1) 100%)",

                "&:hover": {
                  backgroundColor:
                    "linear-gradient(261deg, rgba(2,0,36,1) 0%, rgba(36,36,87,1) 35%, rgba(0,212,255,1) 100%)",
                },
              },
              ["." + menuClasses.subMenuContent]: {
                background:
                  "linear-gradient(38deg, rgba(2,0,36,1) 0%, rgba(54,54,137,1) 35%, rgba(0,212,255,1) 100%)",
              },
            }}
          >
            <iframe
              width="100%"
              height="100%"
              title="map-sidebar"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d979.7169464656029!2d106.77654896955353!3d10.821428616589504!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317526fbdd279a5b%3A0x64ba765a7f54651e!2zNTEgxJAuIDEwOSwgUGjGsOG7m2MgTG9uZyBCLCBRdeG6rW4gOSwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1701748986775!5m2!1svi!2s"
              loading="lazy"
            ></iframe>
          </SubMenu>

          {/* Forum */}
          <MenuItem component={<Link to="/cart" />}>
            <div className="fas fa-shopping-cart" /> Cart
          </MenuItem>

          {/* About us */}
          <SubMenu
            label="About Me"
            icon={<i className="fas fa-hashtag" />}
            rootStyles={{
              ["& > ." + menuClasses.button]: {
                backgroundColor:
                  "linear-gradient(276deg, rgba(54,199,201,1) 0%, rgba(71,109,212,1) 25%, rgba(173,212,94,1) 75%, rgba(215,174,88,1) 100%)",

                "&:hover": {
                  backgroundColor:
                    "linear-gradient(261deg, rgba(2,0,36,1) 0%, rgba(36,36,87,1) 35%, rgba(0,212,255,1) 100%)",
                },
              },
              ["." + menuClasses.subMenuContent]: {
                background:
                  "linear-gradient(225deg, rgba(175,171,230,1) 0%, rgba(135,135,178,1) 35%, rgba(195,206,227,1) 74%, rgba(148,219,235,1) 100%)",
              },
            }}
          >
            <MenuItem
              href="https://www.facebook.com/TuanBlackU"
              target="_blank"
            >
              <div className="fab fa-facebook"></div> Facebook
            </MenuItem>

            <MenuItem
              href="https://www.tiktok.com/@tuanblack69"
              target="_blank"
            >
              <div className="fab fa-tiktok"></div> TikTok
            </MenuItem>

            <MenuItem
              href="https://github.com/tuannho0802/E-Commerce-Reptiles"
              target="_blank"
            >
              <div className="fab fa-github"></div> Source Web
            </MenuItem>
          </SubMenu>

          {/* Contact */}
          <SubMenu
            label="Contact"
            icon={<i className="fas fa-address-card" />}
            rootStyles={{
              ["& > ." + menuClasses.button]: {
                backgroundColor:
                  "linear-gradient(276deg, rgba(54,199,201,1) 0%, rgba(71,109,212,1) 25%, rgba(173,212,94,1) 75%, rgba(215,174,88,1) 100%)",

                "&:hover": {
                  backgroundColor:
                    "linear-gradient(261deg, rgba(2,0,36,1) 0%, rgba(36,36,87,1) 35%, rgba(0,212,255,1) 100%)",
                },
              },
              ["." + menuClasses.subMenuContent]: {
                background:
                  "linear-gradient(225deg, rgba(175,171,230,1) 0%, rgba(135,135,178,1) 35%, rgba(195,206,227,1) 74%, rgba(148,219,235,1) 100%)",
              },
            }}
          >
            <MenuItem onClick={() => copyToClipboard("0934092362")}>
              <div className="fab fa-phone" /> Phone: 0934092362
            </MenuItem>

            <MenuItem
              onClick={() => copyToClipboard("tuanlhgcs200305@fpt.edu.vn")}
            >
              <div className="fab fa-inbox" /> Email: tuanlhgcs200305@fpt.edu.vn
            </MenuItem>
          </SubMenu>

          {/* Conditional submenu based on user role */}
          {userInfo && userInfo.isAdmin && (
            <SubMenu
              label="Admin"
              icon={<i className="fas fa-users-cog"></i>}
              rootStyles={{
                ["& > ." + menuClasses.button]: {
                  backgroundColor:
                    "linear-gradient(276deg, rgba(54,199,201,1) 0%, rgba(71,109,212,1) 25%, rgba(173,212,94,1) 75%, rgba(215,174,88,1) 100%)",

                  "&:hover": {
                    backgroundColor:
                      "linear-gradient(261deg, rgba(2,0,36,1) 0%, rgba(36,36,87,1) 35%, rgba(0,212,255,1) 100%)",
                  },
                },
                ["." + menuClasses.subMenuContent]: {
                  background:
                    "linear-gradient(225deg, rgba(175,171,230,1) 0%, rgba(135,135,178,1) 35%, rgba(195,206,227,1) 74%, rgba(148,219,235,1) 100%)",
                },
              }}
            >
              <LinkContainer to="/admin/dashboard">
                <MenuItem>
                  <div className="fas fa-chart-line" /> Dashboard
                </MenuItem>
              </LinkContainer>
              <LinkContainer to="/admin/products">
                <MenuItem>
                  <div className="fas fa-otter" /> Products
                </MenuItem>
              </LinkContainer>
              <LinkContainer to="/admin/orders">
                <MenuItem>
                  <div className="fas fa-list-alt" /> Orders
                </MenuItem>
              </LinkContainer>
              <LinkContainer to="/admin/users">
                <MenuItem>
                  <div className="fas fa-users" /> Users
                </MenuItem>
              </LinkContainer>
            </SubMenu>
          )}
        </Menu>
      </Sidebar>
    </div>
  );
}
