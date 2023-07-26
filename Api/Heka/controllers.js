const { cotizar } = require("../Servientrega/logic");

exports.cotizar = async (req, res) => {
    const cotizador = req.body;
    const response = cotizar(cotizador);

    res.send(response);
}