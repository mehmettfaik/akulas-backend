const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(response);
};

const errorResponse = (res, error, statusCode = 500, message = 'Error') => {
  const response = {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};
