const { RSuccess, RCatchError } = require("../../Network/responses");
const { listaEstados } = require("./network");

exports.listarEstados = async (req, res) => {
    try {
        const estados = await listaEstados();
        RSuccess(req, res, estados);
    } catch (e) {
        RCatchError(req, res, e);
    }
}

exports.actualizarEstado = async (req, res) => {
    try {
        RSuccess(req, res, "Método aún no implementado");
    } catch (e) {
        RCatchError(req, res, e);
    }
}

exports.agregarEstado = async (req, res) => {
    try {
        RSuccess(req, res, "Método aún no implementado");
    } catch (e) {
        RCatchError(req, res, e);
    }
}