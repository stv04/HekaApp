const { RSuccess, RError, RCatchError } = require("../../Network/responses");
const { SchCotizar } = require("../../Schemas/cotizador");
const { getUserData } = require("../Heka/network");
const { cotizador } = require("./network");

/* La función `exports.auth` es una función middleware que se utiliza para autenticar una solicitud
validando la existencia del usuairo heka. */
exports.auth = async (req, res, next) => {
    try {
        if(req.headers.authentication) {
            const datosUsuario = await getUserData(req.headers);
            req.userData = datosUsuario;
        }

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

        solicitudCotizacion.id_user = req.query.idFirebase ?? null;
        
        // Se procede a cotizar
        const response = await cotizador(solicitudCotizacion);

        // finalmente se devuelve la estructura de respuesta
        RSuccess(req, res, response);

    } catch (e) {
        console.log(e);
        RCatchError(req, res, e);
    }
}
