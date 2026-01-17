const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400, 'ERR_DB_CAST');
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400, 'ERR_DB_DUPLICATE');
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400, 'ERR_DB_VALIDATION');
};

const handleJWTError = () =>
    new AppError('Invalid token. Please log in again!', 401, 'ERR_JWT_INVALID');

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', 401, 'ERR_JWT_EXPIRED');

const sendErrorDev = (err, req, res) => {
    // A) API
    logger.error(`DEV ERROR: ${err.message}`, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });

    return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, req, res) => {
    // A) API
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            errorCode: err.errorCode,
        });
    }

    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    logger.error('ERROR 💥', err);

    // 2) Send generic message
    return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
        errorCode: 'ERR_INTERNAL_SERVER',
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else {
        // Make a copy of the error object
        let error = { ...err };
        error.message = err.message;
        error.name = err.name; // Copy name specifically as it might be non-enumerable

        // Specific Error Handling Strategies
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};
