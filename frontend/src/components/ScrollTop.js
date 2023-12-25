import React from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const ScrollToTopButton = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="scroll-to-top-button">
        <OverlayTrigger
          delay={100}
          placement="top"
          overlay={<Tooltip id="tooltip">Click to scroll to top</Tooltip>}
        >
          <i
            style={{
              fontSize: "3em",
              color: "#007bff",
              backgroundColor: "#ffff",
              borderRadius: "50%",
            }}
            className="fas fa-arrow-alt-circle-up m-3"
            onClick={scrollToTop}
          />
        </OverlayTrigger>
      </div>
    </>
  );
};

export default ScrollToTopButton;
