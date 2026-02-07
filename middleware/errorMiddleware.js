const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Handle Multer file size error specifically
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'Required 5MB or less to upload';
    }

    res.status(statusCode);
    res.json({
        message: message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export { notFound, errorHandler };
