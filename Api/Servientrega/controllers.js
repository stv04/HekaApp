const { RSuccess, RError } = require("../../Network/responses");
const { SchCotizar } = require("../../Schemas/cotizador");
const { cotizarServi, calcularPreciosAdicionalesServientrega } = require("./network");

exports.cotizar = async (req, res) => {
    try {
        const cotizador = req.body;
        const parametrosCotizacion = req.parametrosCotizacion;
        
        const safePrse = SchCotizar.safeParse(cotizador);
        if(!safePrse.success) {
            return RError(req, res, safePrse.error.issues, 400);
        }
        
        const response = await cotizarServi(cotizador);
    
        if(response.error) return RError(req, res, response, 409);

        calcularPreciosAdicionalesServientrega(cotizador, response, parametrosCotizacion);
        RSuccess(req, res, response);

    } catch (e) {
        RError(req, res, e.message, 409);
    }
}