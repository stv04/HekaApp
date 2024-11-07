const fetch = require("node-fetch");
const { RSuccess, RError, RCatchError } = require("../../Network/responses");
const { SchNuevoEnvio, SchEstado } = require("../../Schemas/envios");
const { estandarizarFecha } = require("../../Utils/funciones");
const { cotizador } = require("../Cotizador/network");
const { idGuia, generarEnvio, guardarEstado, obtenerEstados, obtenerEnvio } = require("./network");


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

        const fecha = new Date(); 
        guia.fecha = fecha;
        guia.timeline = fecha.getTime();
        guia.fechaNatural = estandarizarFecha(fecha, "DD/MM/YYYY HH:mm");
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


exports.agregarSeguimiento = async (req, res) => {
    try {
        const seguimiento = req.body;
        const { idEnvio } = req.params;
        // const apiPatchEstado = "http://localhost:6200/procesos/actualizarEstado/";
        const apiPatchEstado = "https:admin.hekaentrega.co/procesos/actualizarEstado/";

        // Se valida que el formato recibido sea el correcto
        const safePrse = SchEstado.safeParse(seguimiento);

        // De otra forma retorna error error la librería "zod"
        if(!safePrse.success) {
            return RError(req, res, safePrse.error.issues, 400);
        }

        const fecha = new Date(); 
        seguimiento.fecha = fecha;
        seguimiento.timeline = fecha.getTime();
        seguimiento.fechaNatural = estandarizarFecha(fecha, "DD/MM/YYYY HH:mm");

        infoGuia = await obtenerEnvio(idEnvio);


        await guardarEstado(idEnvio, seguimiento);

        const response = {
            message: "Estado guardado correctamente"
        }

        await fetch(apiPatchEstado + infoGuia.numeroGuia, {
            method: "POST",
            headers: {
                "Content-type": "Application/json"
            },
            body: JSON.stringify(seguimiento)
        })
        .then(d => d.json())
        .then(d => console.log(d))
        .catch(e => {
            console.log("Error al actualizar con plataforma: " + e.message);
        });

        // finalmente se devuelve la estructura de respuesta
        RSuccess(req, res, response);

    } catch (e) {
        RCatchError(req, res, e);
    }
}

exports.obtenerSeguimiento = async (req, res) => {

    try {
        const { idEnvio } = req.params;

        const envio = await obtenerEnvio(idEnvio);

        const basicInformation = {
            numeroGuia: envio.numeroGuia,
            fecha_creacion: envio.fechaNatural
        }
    
        const estadosEnvio = await obtenerEstados(idEnvio);
        basicInformation.seguimiento = estadosEnvio;

        RSuccess(req, res, basicInformation);

    } catch (e) {
        RCatchError(req, res, e);
    }
}