export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  const payload = {
    success: false,
    message: error.message || "Internal server error",
  };
  if (Array.isArray(error.details) && error.details.length > 0) {
    payload.details = error.details;
  }
  res.status(status).json(payload);
}
