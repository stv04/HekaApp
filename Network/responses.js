function responseErrorApi(req, res) {
    console.log("entrando en responseApi")
    res.status(400).send("ESTO ES UN ERROR");
}

/**
 * La función RSuccess es una función auxiliar en JavaScript que envía una respuesta exitosa con un
 * código de estado, cuerpo y estado de error específicos.
 * @param req - El parámetro `req` es el objeto de solicitud, que contiene información sobre la
 * solicitud HTTP entrante, como encabezados, parámetros de consulta y cuerpo de la solicitud. Por lo
 * general, lo proporciona el marco web o el servidor que maneja la solicitud.
 * @param res - El parámetro `res` es el objeto de respuesta que se utiliza para enviar la respuesta al
 * cliente. Normalmente lo proporciona el marco web o la biblioteca que se utiliza.
 * @param body - El parámetro "cuerpo" es el cuerpo de la respuesta que desea enviar al cliente. Puede
 * ser cualquier dato u objeto que desee incluir en la respuesta.
 * @param status - El parámetro `status` es un parámetro opcional que representa el código de estado
 * HTTP que se devolverá en la respuesta. Si no se proporciona ningún código de estado, el valor
 * predeterminado es 200 (OK).
 */
function RSuccess(req, res, body, status) {
    const statusCode = status || 200;
    res.status(statusCode)
    .json({
        error: false,
        status: statusCode,
        body: body
    })
}

/**
 * La función RError se utiliza para enviar una respuesta de error con un código de estado específico y
 * un mensaje en formato JSON.
 * @param req - El parámetro `req` es el objeto de solicitud que contiene información sobre la
 * solicitud HTTP entrante, como encabezados, parámetros de consulta y cuerpo de la solicitud. Por lo
 * general, lo proporciona el marco web o el servidor que maneja la solicitud.
 * @param res - El parámetro `res` es el objeto de respuesta que se utiliza para enviar la respuesta al
 * cliente. Normalmente lo proporciona el marco Express en Node.js.
 * @param message - El parámetro de mensaje es una cadena que representa el mensaje de error que desea
 * enviar en la respuesta.
 * @param status - El parámetro `status` es un parámetro opcional que representa el código de estado
 * HTTP que se enviará en la respuesta. Si no se proporciona ningún valor, el valor predeterminado se
 * establece en 500 (Error interno del servidor).
 */
function RError(req, res, message, status) {
    const statusCode = status || 500;

    res.status(statusCode)
    .json({
        error: true,
        status: statusCode,
        body: message
    });
}

/**
 * La función RCatchError maneja errores en una aplicación Node.js configurando el código de estado y
 * el mensaje apropiados en el objeto de respuesta.
 * @param req - El parámetro `req` es el objeto de solicitud, que contiene información sobre la
 * solicitud HTTP entrante, como encabezados, parámetros de consulta y cuerpo de la solicitud.
 * @param res - El parámetro `res` es el objeto de respuesta que se utiliza para enviar la respuesta al
 * cliente. Normalmente es una instancia de la clase `http.ServerResponse` en Node.js.
 * @param error - El parámetro `error` es un objeto que contiene información sobre el error ocurrido.
 * Puede tener las siguientes propiedades:
 */
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

/**
 * La función `ThrowError` arroja un error con un mensaje y un código de estado específicos.
 * @param message - El parámetro `message` es una cadena que representa el mensaje de error que desea
 * generar. Puede ser cualquier mensaje de error personalizado que desee mostrar cuando se produzca el
 * error.
 * @param [statusCode=409] - El parámetro `statusCode` es un parámetro opcional que especifica el
 * código de estado HTTP que se asociará con el error. Si no se proporciona ningún valor para
 * "statusCode", el valor predeterminado es "409" (Conflicto).
 */
function ThrowError(message, statusCode = 409) {
    const err = new Error(message);

    err.statusCode = statusCode;
    
    throw err;
}

/**
 * La función `ThrowSpecifiedError` arroja un error con las propiedades especificadas.
 * @param struct - El parámetro `struct` es un objeto que contiene las siguientes propiedades:
 *  - message: "El mensaje que se retorna al cliente"
 *  - statusCode?: El código de estado hhtp
 *  - code: Código interno que permita ubicar la causa del error ( ya que es para manejar errores controlados )
 */
function ThrowSpecifiedError(struct) {
    const err = new Error(struct.message);

    err.statusCode = struct.statusCode || 409;
    err.code = struct.code
    
    throw err;
}

module.exports = {
    RSuccess, RError, RCatchError, ThrowError, ThrowSpecifiedError
}