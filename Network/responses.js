function responseErrorApi(req, res) {
    console.log("entrando en responseApi")
    res.status(400).send("ESTO ES UN ERROR");
}

function RSuccess(req, res, body, status) {
    const statusCode = status || 200;
    res.status(statusCode)
    .json({
        error: false,
        status: statusCode,
        body: body
    })
}

function RError(req, res, message, status) {
    const statusCode = status || 500;

    res.status(statusCode)
    .json({
        error: true,
        status: statusCode,
        body: message
    });
}

function RCatchError(req, res, error) {
    const statusCode = error.statusCode || 500;
    const statusMessage = error.message || "Error interno.";

    const response = {
        error: true,
        status: statusCode,
        body: statusMessage,
        code: error.code || null
    }

    res.status(statusCode)
    .json(response);
}

function ThrowError(message, code, statusCode = 409) {
    const err = new Error(message);

    err.statusCode = statusCode;
    err.code = code
    
    throw err;
}

function ThrowSpecifiedError(struct) {
    const err = new Error(struct.message);

    err.statusCode = struct.statusCode || 409;
    err.code = struct.code
    
    throw err;
}

module.exports = {
    RSuccess, RError, RCatchError, ThrowError, ThrowSpecifiedError
}