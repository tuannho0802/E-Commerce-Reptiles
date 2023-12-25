import React, { useContext } from "react";
import Table from "react-bootstrap/Table";
import { Store } from "../Store";
import Badge from "react-bootstrap/Badge";

const Forum = ({ post }) => {
  const { state } = useContext(Store);
  const { userInfo } = state;

  // Function to limit the number of words in a string
  const limitTitle = (title, limit) => {
    const words = title.split(" ");
    if (words.length > limit) {
      return words.slice(0, limit).join(" ") + " ...";
    }
    return title;
  };

  // Limiting post.title
  const limitedTitle = limitTitle(post.title, 8);

  return (
    <Table
      responsive
      style={{ cursor: "pointer", maxWidth: "100%" }}
      variant="info"
      hover
      className="mb-2 appear-animation forum-row"
    >
      <tbody>
        <tr>
          {/* User name and avatar */}
          <td style={{ width: "0.5%" }}>
            <img
              src={post.user.avatar}
              alt="User Avatar"
              style={{
                width: "2vw",
                height: "2vw",
                borderRadius: "50%",
              }}
            />
          </td>
          <td style={{ width: "5%" }}>
            <p
              className={`post-user ${
                userInfo && userInfo._id === post.user._id
                  ? "you-text"
                  : "other-text"
              }`}
              style={{ fontSize: "1em" }}
            >
              {userInfo && userInfo._id === post.user._id ? (
                <span style={{ color: "#a81313" }}>You</span>
              ) : (
                post.user.name
              )}
            </p>
          </td>

          {/* Title */}
          <td style={{ width: "5%" }}>
            <strong>Title:</strong> {limitedTitle}
          </td>

          {/* Display Likes and Dislikes */}
          <td style={{ width: "1%" }}>
            <Badge pill>
              <i className="fas fa-thumbs-up"></i>{" "}
              {post.likes ? post.likes.length : 0}
            </Badge>
          </td>
          <td style={{ width: "1%" }}>
            <Badge pill bg="danger">
              <i className="fas fa-thumbs-down"></i>{" "}
              {post.dislikes ? post.dislikes.length : 0}
            </Badge>
          </td>

          {/* Posted time */}
          <td style={{ width: "2%" }}>
            <strong>Posted:</strong> {post.createdAt.substring(0, 10)}
          </td>
        </tr>
      </tbody>
    </Table>
  );
};

export default Forum;
