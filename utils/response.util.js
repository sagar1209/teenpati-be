exports.sendSuccessResponse = (
    res,
    data = [],
    message = 'Success',
    status_code = 200
  ) => {
    const response = { status_code, message, data };
    res.status(status_code).json({ status: true, ...response });
  };
  
  exports.sendErrorResponse = (
    res,
    data = [],
    message = 'Internal Server Error',
    status_code = 500
  ) => {
    const response = { status_code, message, data };
    res.status(status_code).json({ status: false, ...response });
  };
  