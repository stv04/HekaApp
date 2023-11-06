const { RError, RSuccess } = require("../../Network/responses");
const { ciudadesCotizador, listaCompletaCiudades, update, getOne, cityStatistics } = require("./network");

exports.listaCiudades = async (req, res) => {
    const listaCiudades = await ciudadesCotizador();
    RSuccess(req, res, listaCiudades);
}

exports.listaCiudadesCompleta = async (req, res) => {
    const listaCiudades = await listaCompletaCiudades();
    RSuccess(req, res, listaCiudades);
}

exports.obtenerCiudad = async (req, res) => {
    try {
        const dane = req.params.dane;
        const ciudad = await getOne(dane);
    
        return RSuccess(req, res, ciudad);
    } catch (e) {
        return RError(req, res, e.message, 408);
    }
}

exports.ActualizarCiudad = async (req, res) => {
    const body = req.body;
    const actualizacion = update(body.dane_ciudad);
    res.send("¿Si se va a actualizar?:" + actualizacion);
}

exports.obtenerEstadisticasCiudad = async (req, res) => {
    const {dane} = req.params;

    const estadisticas = await cityStatistics(dane);

    RSuccess(req, res, estadisticas);
}