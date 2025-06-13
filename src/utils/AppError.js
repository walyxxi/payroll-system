class AppError extends Error {
  constructor(message, status = 500, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
export default AppError;