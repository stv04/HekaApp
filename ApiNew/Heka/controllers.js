const { RSuccess, RError, RCatchError } = require("../../Network/responses");
const { obtenerValoresCotizacion } = require("./network");

/* La función `exports.auth` es una función middleware que se utiliza para autenticar una solicitud
validando la existencia del usuairo heka. */
exports.auth = async (req, res, next) => {
    try {
        const datosDeUsuario = await getUserData(req.headers);
        const parametrosCotizacion = obtenerValoresCotizacion(datosDeUsuario.datos_personalizados);
        req.parametrosCotizacion = parametrosCotizacion;
        next();
    } catch (e) {
        RError(req, res, e.message, e.statusCode);
    }
}

exports.datosDeUsuario = async (req, res) => {
    try {
        const datosDeUsuario = await getUserData(req.params.id);
        RSuccess(req, res, datosDeUsuario)
    } catch (e) {
        RError(req, res, e.message, e.statusCode);
    }
}