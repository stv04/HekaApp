const fetch = require("node-fetch");
const { RSuccess, RError, RCatchError, ThrowError } = require("../../Network/responses");
const { SchNuevoEnvio, SchEstado } = require("../../Schemas/envios");
const { estandarizarFecha } = require("../../Utils/funciones");
const { cotizador } = require("../Cotizador/network");
const { idGuia, generarEnvio, guardarEstado, obtenerEstados, obtenerEnvio, actualizarRutaEntrega, obtenerRutaEntrega, enviosMensajeroPorEstadoRecepcion, rutaEntregaGuia, obtenerEnvioByNumeroGuia, envioARuta, obtenerUltimoEstado, actualizarEnvio, crearRutaEntrega, obtenerEnvios } = require("./network");
const { estadosRecepcion } = require("../../Network/constants");
const config = require("../../config/config");
const moment = require('moment-timezone');


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

        const fecha = moment();
        guia.fecha = fecha.toDate();
        guia.timeline = fecha.valueOf();
        guia.fechaNatural = fecha.format();

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


exports.obtenerEnvios = async (req, res) => {
    try {
        const filtro = req.query;
        
        const response = await obtenerEnvios(filtro);
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

        const apiPatchEstado = config.ENVIRONMENT === "dev" ? "http://localhost:6200/procesos/actualizarEstado/" : "https:admin.hekaentrega.co/procesos/actualizarEstado/";

        // Se valida que el formato recibido sea el correcto
        const safePrse = SchEstado.safeParse(seguimiento);

        // De otra forma retorna error error la librería "zod"
        if(!safePrse.success) {
            return RError(req, res, safePrse.error.issues, 400);
        }

        const fecha = moment();
        seguimiento.fecha = fecha.toDate();
        seguimiento.timeline = fecha.valueOf();
        seguimiento.fechaNatural = fecha.format();

        const infoGuia = await obtenerEnvio(idEnvio);
        if(!infoGuia.estado_recepcion && seguimiento.tipo !== estadosRecepcion.recibido) throw new Error("Se debe recibir el pedido antes de poder actualizar los estados.");
        if(infoGuia.estado_recepcion === estadosRecepcion.entregado) throw new Error("No se puede actualizar más estados, ya que el envío ha sido entregado.");

        const actualizacionEnvio = {
            estado_recepcion: seguimiento.tipo,
            estado: seguimiento.estado
        }

        // Una vez este estado es ingresado por primera vez, 
        // automáticamente la guía se marca como una devolución permanente
        if(seguimiento.tipo === estadosRecepcion.devuelto) actualizacionEnvio.esDevolucion = true;

        await actualizarEnvio(idEnvio, actualizacionEnvio);

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
        let { idEnvio } = req.params; // Esto representa directamente el di dele envío o el número de guía

        // Primero se intenta obtener el envío por el identificador
        // En caso que no exista, se intenta buscar el envío por número de guía
        let envio = await obtenerEnvio(idEnvio)
        .then(async res => {
            if(res) return res;
            
            const resultByNumGuia = await obtenerEnvioByNumeroGuia(idEnvio);
            if(!resultByNumGuia) return null;

            idEnvio = resultByNumGuia.id;
            return resultByNumGuia;
        });

        // Se busca por id y por número de guía, en caso que no exista de ninguna forma, se devuelve error
        if(!envio) ThrowError('No existe un envío asociado con el parámetro ingresado.');

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
        if( !envio ) throw new Error("No existe un envío asociado a este número");

        const estado = await obtenerUltimoEstado(envio.id);
        if( estado.esNovedad ) throw new Error("Esta envío posee la siguiente novedad: " + estado.descripcion);

        if( [ estadosRecepcion.entregado, estadosRecepcion.devuelto ].includes(envio.estado_recepcion) ) 
            throw new Error("Esta paquete ya ha sido entregada");

        const rutaEntrega = await rutaEntregaGuia(numeroGuia);

        if( !rutaEntrega ) throw new Error("Este paquete no tiene ninguna ruta de entrega");

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

        const enviosPendientes = await enviosMensajeroPorEstadoRecepcion(idUser, [
            estadosRecepcion.validado, estadosRecepcion.empacado, 
            estadosRecepcion.novedad, estadosRecepcion.novedad_op,
            estadosRecepcion.reparto
        ]);

        const rutaBase = enviosPendientes.map(env => {
            let indexRoute = -1;
            if(rutaEntrega) {
                indexRoute = rutaEntrega.guias.indexOf(env.numeroGuia);
            }

            const indicadorRuta = envioARuta(env);
            
            indicadorRuta.posicion = indexRoute;
            indicadorRuta.active = indexRoute !== -1 && env.estado_recepcion !== estadosRecepcion.novedad;
            
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
        const templateName = "seguimiento_envio_hekaprop";
        const apiSendMessage = "https://admin.hekaentrega.co/mensajeria/ws/sendMessage/" + templateName;

        const { idUser } = req.params;
        const data = req.body;
        const { guias } = data;

        if(guias && guias.length) {
            for(let numGuia of guias) {
                const envio = await obtenerEnvioByNumeroGuia(numGuia);
                if(!envio.mensajeSeguimientoEnviado) {
                    
                    const message = {
                        number: envio.esDevolucion ? envio.info_origen.celular : envio.info_destino.celular,
                        params: [envio.numeroGuia, `https://admin.hekaentrega.co/consulta/seguimientoPaquete?n=${envio.numeroGuia}`].map((p) => ({ default: p }))
                    }

                    await fetch(apiSendMessage, {
                        method: "POST",
                        headers: {
                            "Content-type": "Application/json"
                        },
                        body: JSON.stringify(message)
                    })
                    .then(d => d.json())
                    .then(() => actualizarEnvio(envio.id, {mensajeSeguimientoEnviado: true}))
                    .catch(e => {
                        console.log("Error al enviar mensaje: " + e.message);
                    });
                }
            }
        }

        const rutaEntrega = await obtenerRutaEntrega(idUser);
        
        const response = rutaEntrega 
            ? await actualizarRutaEntrega(idUser, data) 
            : await crearRutaEntrega(idUser, data);

        RSuccess(req, res, response);
    } catch (e) {
        RCatchError(req, res, e);
    }
}