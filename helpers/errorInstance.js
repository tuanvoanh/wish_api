const axiosWishError = (error) => {
  return {
    status: 501,
    code: error.response.data.code,
    message: error.response.data.message,
  };
};

module.exports = {
  axiosWishError,
};
