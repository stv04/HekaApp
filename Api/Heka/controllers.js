const { RSuccess, RError } = require("../../Network/responses");
const { SchCotizar } = require("../../Schemas/cotizador");
const { cotizarInter } = require("../Inter/network");
const { cotizarServi } = require("../Servientrega/network");
const { obtenerValoresCotizacion, cotizador, modificarRespuestaCotizacion } = require("./network");

exports.auth = async (req, res, next) => {
    try {
        const parametrosCotizacion = await obtenerValoresCotizacion(req.headers);
        req.parametrosCotizacion = parametrosCotizacion;
        next();
    } catch (e) {
        RError(req, res, e.message, e.statusCode);
    }
}

exports.cotizar = async (req, res) => {
    try {
        const solicitudCotizacion = req.body;
        parametrosCotizacion = req.parametrosCotizacion;
        
        
        const safePrse = SchCotizar.safeParse(solicitudCotizacion);
        if(!safePrse.success) {
            return RError(req, res, safePrse.error.issues, 400);
        }
        
        const response = await cotizador(solicitudCotizacion);
        modificarRespuestaCotizacion(solicitudCotizacion, response.resultado, parametrosCotizacion);
        
        RSuccess(req, res, response);

    } catch (e) {
        console.log(e);
        RError(req, res, e.message, 409);
    }
}