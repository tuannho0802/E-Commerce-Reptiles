
export const getError = (error) =>
  error && error.response && error.response.data.message
    ? error.response.data.message
    : error && error.message
    ? error.message
    : "An Error Occurred.";
