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
        parametrosCotizacion = req.parametrosCotizacion;
        
        // Se valida que el formato recibido sea el correcto
        const safePrse = SchCotizar.safeParse(solicitudCotizacion);

        // De otra forma retorna error error la librería "zod"
        if(!safePrse.success) {
            return RError(req, res, safePrse.error.issues, 400);
        }
        
        // Se procede a cotizar
        const response = await cotizador(solicitudCotizacion);

        // Una vez se cotice, se analiza el resultado ( todas la que hayan sido efectivas ) para modificarles su valor
        modificarRespuestaCotizacion(solicitudCotizacion, response.resultado, parametrosCotizacion);
        
        // finalmente se devuelve la estructura de respuesta
        RSuccess(req, res, response);

    } catch (e) {
        console.log(e);
        RError(req, res, e.message, 409);
    }
}

/* Es la encargada de manejar una solicitud para realizar una cotización para una empresa de transporte específica. */
exports.cotizarTransportadora = async (req, res) => {
    try {
        const solicitudCotizacion = req.body;
        solicitudCotizacion.transportadora = req.params.transportadora;

        parametrosCotizacion = req.parametrosCotizacion;
        
        // Se valida que el formato recibido sea el correcto y se retorna error en caso de que falle
        const safePrse = SchCotizar.safeParse(solicitudCotizacion);
        if(!safePrse.success) {
            return RError(req, res, safePrse.error.issues, 400);
        }
        
        // Se procede a cotizar (función que cotiza con una transportadora en concreto)
        const response = await cotizadorTransportadora(solicitudCotizacion);

        // "respose.error" devuelve true, cuando se retorna un error
        if(response.error) return RError(req, res, response);

        // Funció encargada de modificar y/o agregar valores una vez se halla cotizado
        modificarRespuestaCotizacion(solicitudCotizacion, [response], parametrosCotizacion);
        
        RSuccess(req, res, response);

    } catch (e) {
        console.log(e);
        RCatchError(req, res, e);
    }
}