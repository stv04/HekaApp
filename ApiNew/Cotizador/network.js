const { ThrowSpecifiedError } = require("../../Network/responses");
const { getOne } = require("../Ciudades/network");
const { COD_ENVIA, CONVENCIONAL } = require("../../config/constantes");
const transportadoras = require("../../config/transportadoras");
const respuestasError = require("../../Network/respuestasError");
const { getPricesByUser } = require("../Heka/network");
const { tiposDeCotizacion } = require("../../Network/constants");


const PESO_VOLUMETRICO = 1 / 6000;

const autorizacionCiudad = {
    ORIGEN: "ORIGEN",
    DESTINO: "DESTINO",
    MIXTO: "MIXTO"
}

const ciudades = {
    54001000: {
        dane: 54001000,
        ciudad: "CUCUTA",
        departamento: "NORTE DE SANTANDER",
        tipoValidez: null // Al ser nulo, se trata de un destino inactivo tanto para recibir como para envíar
    },
    11001000: {
        dane: 11001000,
        ciudad: "BOGOTA",
        departamento: "CUNDINAMARCA",
        tipoValidez: autorizacionCiudad.MIXTO
    }
}

const calculatePesoVolumetrico = (volumen) => volumen * PESO_VOLUMETRICO;

function validarTipoCotizacion(ciudadA, ciudadB) {
    if(ciudadA.dane === ciudadB.dane) {
        return tiposDeCotizacion.URBAN;
    } else if (ciudadA.dane !== ciudadB.dane && ciudadA.departamento === ciudadB.departamento) {
        return tiposDeCotizacion.DEPARTAMENTAL;
    } else {
        return tiposDeCotizacion.NACIONAL;
    }
}

function calcularValorFlete(peso, precioFlete) {
    const diferenciaDePeso = peso - precioFlete.pesoMin;
    const valorPesoAdicional = precioFlete.precioKgAdicional * diferenciaDePeso;

    return precioFlete.precioBase + valorPesoAdicional;
}

function calcularSobreflete(reqCotizacion, config) {
    const {porcentajeComision, constanteComision = 0, minimaComision = 0 } = config;
    return reqCotizacion.tipo !== CONVENCIONAL ? 
    Math.max(Math.ceil((reqCotizacion.valorRecaudo * porcentajeComision) + constanteComision), minimaComision) 
    : 0;
}

function calcularSeguroMercancia(reqCotizacion, config) {
    const {porcentajeSeguroMercancia = 0, constanteSeguroMercancia = 0, minimoSeguroMercancia = 0} = config;
    return Math.max(
        Math.ceil((reqCotizacion.valorSeguro * porcentajeSeguroMercancia) + constanteSeguroMercancia), minimoSeguroMercancia
    );
}

function configuracionCotizacion(peso, tipoCotizacion, tipoEnvio, paquetePrecios) {
    const precioFlete = paquetePrecios.find(p => {
        const pesoCoincidente = peso >= p.pesoMin && p.pesoMax >= peso;
        const tipoCotizacionCoincidente = p.tipoCotizacion === tipoCotizacion;
        const tipoEnvioCoincidente = p.tipoEnvio ? p.tipoEnvio = tipoEnvio : true;

        return pesoCoincidente && tipoCotizacionCoincidente && tipoEnvioCoincidente;
    });

    if(!precioFlete) ThrowSpecifiedError(respuestasError.C007);

    return precioFlete;
}

/* Maneja el proceso de obtención de cotizaciones por transportadoras y ciudad para el manejo de logística propia. */
exports.cotizador = async (reqCotizacion) => {
    const {alto, ancho, largo, id_user} = reqCotizacion;

    // Se busca primero la ciudad destino para analizar disponibilidad
    const ciudadDestino = await getOne(reqCotizacion.idDaneCiudadDestino);

    // si se encuentra bloqueada, retorna error porque significa que para la ciudad proporcionada no hay disponibilidad
    if(ciudadDestino.bloqueada) ThrowSpecifiedError(respuestasError.C001);

    const configCiudadOrigen = ciudades[reqCotizacion.idDaneCiudadOrigen];
    if(
        !configCiudadOrigen 
        || ![autorizacionCiudad.ORIGEN, autorizacionCiudad.MIXTO].includes(configCiudadOrigen.tipoValidez)
    ) ThrowSpecifiedError(respuestasError.C008);

    const configCiudadDestino = ciudades[reqCotizacion.idDaneCiudadDestino];
    if(
        !configCiudadDestino 
        || ![autorizacionCiudad.DESTINO, autorizacionCiudad.MIXTO].includes(configCiudadDestino.tipoValidez)
    ) ThrowSpecifiedError(respuestasError.C006);

    const preciosUsuario = await getPricesByUser(id_user);
    const tipoDeCotizacion = validarTipoCotizacion(configCiudadOrigen, configCiudadDestino);
    
    const pesoVolumetrico = calculatePesoVolumetrico(alto*ancho*largo);
    const pesoTomado = Math.ceil(Math.max(reqCotizacion.peso, pesoVolumetrico));
    const configuracionUsuario = configuracionCotizacion(pesoTomado, tipoDeCotizacion, reqCotizacion.tipo, preciosUsuario);

    const response = {
        valorFlete: calcularValorFlete(pesoTomado, configuracionUsuario),
        sobreFlete: calcularSobreflete(reqCotizacion, configuracionUsuario),
        seguroMercancia: calcularSeguroMercancia(reqCotizacion, configuracionUsuario),
        pesoTomado, pesoVolumetrico,
        detalles: reqCotizacion
    }

    return response;
}

/**
 * La función calcula el costo de envío y actualiza los detalles de una cotización en función de una
 * solicitud de cotización determinada.
 * @param solicitudCotizacion - Un objeto que representa una solicitud de cotización para envío.
 * @param cotizacion - El parámetro `cotización` es un objeto que contiene detalles sobre una
 * cotización.
 */
function sumarCostoDeEnvio(solicitudCotizacion, cotizacion) {
  let counter = 0;
  const {detalles} = cotizacion;
  const {valorRecaudo} = solicitudCotizacion;

  const minimoRecaudo = transportadoras[cotizacion.transportadora].valorMinimoEnvio(detalles.peso_liquidar);
  const valorRecaudoPermitiodo = Math.max(minimoRecaudo, valorRecaudo);
    // TODO: falta añadir el valor mínimo de envío
  // ciclo para asegurar que el valor de recaudo insertado no sea mayor a lo que se le va a pagar al usuario
  while (valorRecaudoPermitiodo > Math.round(detalles.recaudo - cotizacion.costoEnvio) && counter < 10) {
    detalles.recaudo = Math.round(valorRecaudo + cotizacion.costoEnvio);
    detalles.seguro =
      cotizacion.transportadora === COD_ENVIA ? detalles.seguro : detalles.recaudo;
    
    counter++;
  }
}