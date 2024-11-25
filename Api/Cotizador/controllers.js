const { RSuccess, RError, RCatchError } = require("../../Network/responses");
const { SchCotizar } = require("../../Schemas/cotizador");
const { obtenerValoresCotizacion, cotizador, modificarRespuestaCotizacion, cotizadorTransportadora } = require("./network");

/* La función `exports.auth` es una función middleware que se utiliza para autenticar una solicitud
validando la existencia del usuairo heka. */
exports.auth = async (req, res, next) => {
    try {
        const parametrosCotizacion = await obtenerValoresCotizacion(req.headers);
        req.parametrosCotizacion = parametrosCotizacion;
        next();
    } catch (e) {
        RError(req, res, e.message, e.statusCode);
    }
}




/* Función asincrónica que maneja una solicitud para realizar una cotización. */
exports.cotizar = async (req, res) => {
    try {
        const solicitudCotizacion = req.body;
        
        // Se valida que el formato recibido sea el correcto
        const safePrse = SchCotizar.safeParse(solicitudCotizacion);

        // De otra forma retorna error error la librería "zod"
        if(!safePrse.success) {
            return RError(req, res, safePrse.error.issues, 400);
        }
        
        // Se procede a cotizar
        const response = await cotizador(solicitudCotizacion);

        // finalmente se devuelve la estructura de respuesta
        RSuccess(req, res, response);

    } catch (e) {
        console.log(e);
        RCatchError(req, res, e);
    }
}
