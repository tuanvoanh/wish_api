const axiosWishError = (error) => {
  return {
    status: 400,
    code: error.response.data.code,
    message: error.response.data.message,
  };
};

module.exports = {
  axiosWishError,
};
