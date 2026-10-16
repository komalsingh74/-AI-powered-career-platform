
const handleCastError = (err) => ({
  statusCode: 400,
  status: "fail",
  message: `Invalid ${err.path}: ${err.value}.`,
});

const handleValidationError = (err) => {
  const errors = Object.values(err.errors || {}).map(
    (error) => error.message
  );

  return {
    statusCode: 400,
    status: "fail",
    message: errors.length
      ? errors.join(". ")
      : "Validation failed.",
  };
};

const handleDuplicateFieldsError = (err) => {
  const fields = Object.keys(err.keyValue || {});

  return {
    statusCode: 400,
    status: "fail",
    message: fields.length
      ? `${fields.join(", ")} already exists. Please use another value.`
      : "Duplicate field value entered. Please use another value.",
  };
};

const handleJwtError = () => ({
  statusCode: 401,
  status: "fail",
  message: "Invalid token. Please log in again.",
});

const handleJwtExpiredError = () => ({
  statusCode: 401,
  status: "fail",
  message: "Your session has expired. Please log in again.",
});

const handleZodError = (err) => ({
  statusCode: 400,
  status: "fail",
  message: Array.isArray(err.issues)
    ? err.issues.map((issue) => issue.message).join(". ")
    : "Request validation failed.",
});

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  let customError = {
    statusCode: err.statusCode || 500,
    status: err.status || "error",
    message:
      (err.statusCode || 500) === 500 && process.env.NODE_ENV !== "development"
        ? "Something went wrong."
        : err.message || "Something went wrong.",
  };

  if (err.name === "CastError") {
    customError = handleCastError(err);
  } else if (err.name === "ValidationError") {
    customError = handleValidationError(err);
  } else if (err.code === 11000) {
    customError = handleDuplicateFieldsError(err);
  } else if (err.name === "JsonWebTokenError") {
    customError = handleJwtError();
  } else if (err.name === "TokenExpiredError") {
    customError = handleJwtExpiredError();
  } else if (err.name === "ZodError") {
    customError = handleZodError(err);
  }

  res.status(customError.statusCode).json({
    status: customError.status,
    message: customError.message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

export { errorHandler };