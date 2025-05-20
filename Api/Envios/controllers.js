const fetch = require("node-fetch");
const { RSuccess, RError, RCatchError, ThrowError } = require("../../Network/responses");
const { SchNuevoEnvio, SchEstado } = require("../../Schemas/envios");
const { estandarizarFecha } = require("../../Utils/funciones");
const { cotizador } = require("../Cotizador/network");
const { idGuia, generarEnvio, guardarEstado, obtenerEstados, obtenerEnvio, actualizarRutaEntrega, obtenerRutaEntrega, enviosMensajeroPorEstadoRecepcion, rutaEntregaGuia, obtenerEnvioByNumeroGuia, envioARuta, obtenerUltimoEstado } = require("./network");


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

exports.obtenerRuta = async (req, res) => {
    try {
        const { numeroGuia } = req.params;

        const envio = await obtenerEnvioByNumeroGuia(numeroGuia);
        if( !envio ) throw new Error("No existe un envío asociado a este número de guía");

        const estado = await obtenerUltimoEstado(envio.id);
        if( estado.esNovedad ) throw new Error("Esta guía se encuentra en novedad");

        if( estado.entregado ) throw new Error("Esta guía ya ha sido entregada");

        const rutaEntrega = await rutaEntregaGuia(numeroGuia);

        if( !rutaEntrega ) throw new Error("Esta guía no tiene ninguna ruta de entrega");

        const response = {
            location: rutaEntrega.location,
            posicion: rutaEntrega.guias.indexOf(numeroGuia),
            envio: envioARuta(envio)
        }

        RSuccess(req, res, response);
    } catch (e) {
        RCatchError(req, res, e);
    }
}

exports.obtenerRutasMensajero = async (req, res) => {
    try {
        const { idUser } = req.params;
        const rutaEntrega = await obtenerRutaEntrega(idUser);
        console.log(rutaEntrega);

        const enviosPendientes = await enviosMensajeroPorEstadoRecepcion(idUser, ["VALIDADO", "EMPACADO", "ENRUTADO", "BLOQUEADO"]);

        const rutaBase = enviosPendientes.map(env => {
            let indexRoute = -1;
            if(rutaEntrega) {
                indexRoute = rutaEntrega.guias.indexOf(env.numeroGuia);
            }

            const indicadorRuta = envioARuta(env);
            
            indicadorRuta.posicion = indexRoute;
            indicadorRuta.active = indexRoute !== -1 && env.estado_recepcion !== "BLOQUEADO";
            
            return indicadorRuta;
        })
        .sort((a,b) => {
            // Mostramos por encima las que son activas
            if(a.active && b.active) {
                // En caso que ambos sean activos, se valida el de menor indice
                return a.posicion - b.posicion;
            } else if (a.active) {
                return -1;
            } else if (b.active) {
                return 1;
            } else {
                return 0;
            }
        });

        const result = {
            ...rutaEntrega,
            ruta: rutaBase
        }

        RSuccess(req, res, result);
    } catch (e) {
        RCatchError(req, res, e);
    }
}

exports.actualizarRuta = async (req, res) => {
    try {
        const { idUser } = req.params;
        const data = req.body;

        const response = await actualizarRutaEntrega(idUser, data);

        RSuccess(req, res, response);
    } catch (e) {
        RCatchError(req, res, e);
    }
}