import React from "react";

function Rating(props) {
  const { rating, numReviews, caption } = props;

  const renderStars = () => {
    const stars = [];
    const roundedRating = Math.round(rating); // Round to the nearest whole star

    for (let i = 1; i <= 5; i++) {
      const starClass = i <= roundedRating ? "fas fa-star" : "far fa-star";

      stars.push(<span key={i} className={starClass}></span>);
    }

    return stars;
  };

  return (
    <div className="rating" style={{ color: "#ffc000" }}>
      {renderStars()}
      {caption ? (
        <span>{caption}</span>
      ) : (
        <span>{" " + numReviews + " reviews"}</span>
      )}
    </div>
  );
}

export default Rating;
