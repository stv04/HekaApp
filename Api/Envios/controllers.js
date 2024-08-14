const { RSuccess, RError, RCatchError } = require("../../Network/responses");
const { SchNuevoEnvio } = require("../../Schemas/envios");
const { cotizador } = require("../Cotizador/network");
const { idGuia, generarEnvio } = require("./network");


/* Función asincrónica que maneja una solicitud para realizar una cotización. */
exports.crearEnvio = async (req, res) => {
    try {
        const guia = req.body;

        
        // Se valida que el formato recibido sea el correcto
        const safePrse = SchNuevoEnvio.safeParse(guia);

        // De otra forma retorna error error la librería "zod"
        if(!safePrse.success) {
            return RError(req, res, safePrse.error.issues, 400);
        }

        // Cotizamos antes de generar la guía, para validar información y costos
        const respuestaCotizacion = await cotizador(guia);
        delete respuestaCotizacion.detalles; // Se eliminan los detalles, ya que el cotizador responde a esto con la información que se le recibe

        // Guardamos la información de cotización empleada
        guia.info_cotizacion = respuestaCotizacion;

        // Obtenemos el número de guía generado
        const idCreado = await idGuia();

        guia.numeroGuia = idCreado;

        await generarEnvio(guia);

        const response = {
            numeroGuia: idCreado,
            message: "Guía creada exitósamente"
        }

        // finalmente se devuelve la estructura de respuesta
        RSuccess(req, res, response);

    } catch (e) {
        console.log(e);
        RCatchError(req, res, e);
    }
}
