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
    const statusMessage = message || "Error interno.";

    res.status(statusCode)
    .json({
        error: true,
        status: statusCode,
        body: message
    });
}

function TrowError(message, statusCode = 409) {
    const err = new Error(message);

    err.statusCode = statusCode;
    
    throw err;
}

module.exports = {
    RSuccess, RError, TrowError
}