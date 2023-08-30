const { RError } = require("../../Network/responses");
const { ciudadesCotizador, listaCompletaCiudades, update, getOne } = require("./network");

exports.listaCiudades = async (req, res) => {
    const listaCiudades = await ciudadesCotizador();
    res.json(listaCiudades);
}

exports.listaCiudadesCompleta = async (req, res) => {
    const listaCiudades = await listaCompletaCiudades();
    res.json(listaCiudades);
}

exports.obtenerCiudad = async (req, res) => {
    try {
        const dane = req.params.dane;
        const ciudad = await getOne(dane);
    
        return res.json(ciudad);
    } catch (e) {
        return RError(req, res, e.message, 408);
    }
}

exports.ActualizarCiudad = async (req, res) => {
    const body = req.body;
    const actualizacion = update(body.dane_ciudad);
    res.send("¿Si se va a actualizar?:" + actualizacion);
}