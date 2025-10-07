const { doc, getDoc } = require("firebase/firestore");
const { db } = require("../../storage/firebase");
const { ThrowError, ThrowSpecifiedError } = require("../../Network/responses");
const { getOne } = require("../Ciudades/network");
const { COD_SERVIENTREGA, COD_INTERRAPIDISIMO, CONTRAENTREGA, COD_ENVIA, COD_COORDINADORA, CONVENCIONAL } = require("../../config/constantes");
const { cotizarServi, calcularPreciosAdicionalesServientrega } = require("../Servientrega/network");
const { cotizarInter, calcularPreciosAdicionalesInterrapidisimo } = require("../Inter/network");
const { cotizarCoord, calcularPreciosAdicionalesCoordinadora } = require("../Coordinadora/network");
const transportadoras = require("../../config/transportadoras");
const respuestasError = require("../../Network/respuestasError");
const { getPricesByUser } = require("../Heka/network");
const { tiposDeCotizacion } = require("../../Network/constants");


const PESO_VOLUMETRICO = 1 / 6000;

// objeto base que importa todas la funciones para cotizar por trasportadora 
const cotizacionesDisponibLes = {
    [COD_SERVIENTREGA]: cotizarServi,
    [COD_INTERRAPIDISIMO]: cotizarInter,
    [COD_COORDINADORA]:cotizarCoord
}

const autorizacionCiudad = {
    ORIGEN: "ORIGEN",
    DESTINO: "DESTINO",
    MIXTA: "MIXTA"
}

const ciudades = {
    54001000: {
        dane_ciudad: 54001000,
        ciudad: "CUCUTA",
        departamento: "NORTE DE SANTANDER",
        disponibilidad: autorizacionCiudad.ORIGEN // Al ser nulo, se trata de un destino inactivo tanto para recibir como para envíar
    },
    11001000: {
        dane_ciudad: 11001000,
        ciudad: "BOGOTA",
        departamento: "CUNDINAMARCA",
        disponibilidad: autorizacionCiudad.MIXTA
    },
    25754000: {
        dane_ciudad: 25754000,
        ciudad: "SOACHA",
        departamento: "CUNDINAMARCA",
        disponibilidad: autorizacionCiudad.MIXTA
    }
}

const calculatePesoVolumetrico = (volumen) => volumen * PESO_VOLUMETRICO;

function validarTipoCotizacion(ciudadA, ciudadB) {
    if(ciudadA.dane_ciudad === ciudadB.dane_ciudad) {
        return tiposDeCotizacion.URBAN;
    } else if (ciudadA.dane_ciudad !== ciudadB.dane_ciudad && ciudadA.departamento === ciudadB.departamento) {
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
        const pesoCoincidente = peso >= p.pesoMin && p.pesoMax > peso;
        const tipoCotizacionCoincidente = p.tipoCotizacion === tipoCotizacion;
        const tipoEnvioCoincidente = p.tipoEnvio ? p.tipoEnvio === tipoEnvio : true;

        return pesoCoincidente && tipoCotizacionCoincidente && tipoEnvioCoincidente;
    });

    if(!precioFlete) ThrowSpecifiedError(respuestasError.C007);

    return precioFlete;
}

/* Maneja el proceso de obtención de cotizaciones por transportadoras y ciudad para el manejo de logística propia. */
exports.cotizador = async (reqCotizacion) => {
    const {alto, ancho, largo, id_user} = reqCotizacion;

    // Se busca primero la ciudad destino para analizar disponibilidad
    const ciudadOrigen = await getOne(reqCotizacion.idDaneCiudadOrigen);
    const ciudadDestino = await getOne(reqCotizacion.idDaneCiudadDestino);

    // si se encuentra bloqueada, retorna error porque significa que para la ciudad proporcionada no hay disponibilidad
    if(ciudadDestino.bloqueada) ThrowSpecifiedError(respuestasError.C001);

    // const configCiudadOrigen = ciudades[reqCotizacion.idDaneCiudadOrigen];
    if(
        !ciudadOrigen 
        || ![autorizacionCiudad.ORIGEN, autorizacionCiudad.MIXTA].includes(ciudadOrigen.disponibilidad)
    ) {
        if(ciudadOrigen.transp_respaldo) {
            
            return {
                message: 'Ciudad Origen no disponible con Heka', 
                transp_respaldo: ciudadOrigen.transp_respaldo
            }

        } else {
            ThrowSpecifiedError(respuestasError.C008);
        }
    }

    // const configCiudadDestino = ciudades[reqCotizacion.idDaneCiudadDestino];
    if(
        !ciudadDestino 
        || ![autorizacionCiudad.DESTINO, autorizacionCiudad.MIXTA].includes(ciudadDestino.disponibilidad)
    ) ThrowSpecifiedError(respuestasError.C006);

    const preciosUsuario = await getPricesByUser(id_user);
    const tipoDeCotizacion = validarTipoCotizacion(ciudadOrigen, ciudadDestino);
    
    const pesoVolumetrico = calculatePesoVolumetrico(alto*ancho*largo);
    const pesoTomado = Math.ceil(Math.max(reqCotizacion.peso, pesoVolumetrico));
    const configuracionUsuario = configuracionCotizacion(pesoTomado, tipoDeCotizacion, reqCotizacion.tipo, preciosUsuario);

    const response = {
        valorFlete: calcularValorFlete(pesoTomado, configuracionUsuario),
        sobreFlete: calcularSobreflete(reqCotizacion, configuracionUsuario),
        seguroMercancia: calcularSeguroMercancia(reqCotizacion, configuracionUsuario),
        pesoTomado, pesoVolumetrico,
        aplicaCostoDevolucion: configuracionUsuario.aplicaCostoDevolucion ?? false,
        detalles: reqCotizacion
    }

    return response;
}

/* Se encarga de manejar el proceso de obtención de una
cotización de una empresa de transporte específica. */
exports.cotizadorTransportadora = async (reqCotizacion) => {
    // Recibo la ciudad de destino para analizar si está disponible
    const ciudadDestino = await getOne(reqCotizacion.idDaneCiudadDestino);

    if(!ciudadDestino) ThrowSpecifiedError(respuestasError.C005);
    // la cotizzación debería manejar la variables de la transportadora, para conocer la seleccionada
    const t = reqCotizacion.transportadora;

    // Si la ciudad destino se encuentra bloqueada retorna error
    if(ciudadDestino.bloqueada) ThrowSpecifiedError(respuestasError.C001);

    // Obtenemos las configuraciones dadas para la transportadora en dicha ciudad
    const configTransportadoraPorCiudad = ciudadDestino.transportadoras[t];

    // Si la ciudad destino se encuentra bloqueada devuelve error en la cotización
    if(configTransportadoraPorCiudad && configTransportadoraPorCiudad.bloqueada) 
        ThrowSpecifiedError(respuestasError.C002);

    // Analiza también las configuraciones propias de las transportadoras y retorna error en caso que no cumpla con las condiciones
    if(!transportadoras[t] || transportadoras[t].bloqueada === true)
        ThrowSpecifiedError(respuestasError.C003);

    // Se retorna error en caso de que entre las cotizaciones disponibles no exista un función encargada de cotizar
    if(!cotizacionesDisponibLes[t])
        ThrowSpecifiedError(respuestasError.C004);

    const cotizadorTransportadora = cotizacionesDisponibLes[t];

    // finalmente se procede a cotizar para devolver dicho resultado
    const response = await cotizadorTransportadora(reqCotizacion);

    return response;

}

/* Modifica la respuesta de una cotización agregando
información adicional y calculando precios adicionales en base a los parámetros proporcionados. */
exports.modificarRespuestaCotizacion = (solicitudCotizacion, cotizaciones, parametros) => {
    cotizaciones.forEach(c => {
        c.habilitada = transportadoras[c.transportadora].habilitada(parametros);
        agregarSobreFleteHeka(solicitudCotizacion, c, parametros);

        switch(c.transportadora) {
            case COD_SERVIENTREGA:
                calcularPreciosAdicionalesServientrega(solicitudCotizacion, c, parametros);
            break;
            case COD_INTERRAPIDISIMO: 
                calcularPreciosAdicionalesInterrapidisimo(solicitudCotizacion, c, parametros);
            break;
            case COD_COORDINADORA: 
                calcularPreciosAdicionalesCoordinadora(solicitudCotizacion, c, parametros);
            break;
            
            default:
            break;
        }

        if(solicitudCotizacion.fleteFlexiiAdicional) {
            agregarComisionAdicionalFlexii(c);
        }

        if(solicitudCotizacion.tipo === CONTRAENTREGA || solicitudCotizacion.sumarCostoEnvio) {
            sumarCostoDeEnvio(solicitudCotizacion, c);
        }
        
    });

    return cotizaciones;
}

function agregarSobreFleteHeka(solicitudCotizacion, respuestaCotizacion, preciosPersonalizados) {
    const sobreFlete = calcularSobrefleteHeka(solicitudCotizacion, respuestaCotizacion, preciosPersonalizados);

    respuestaCotizacion.sobrefleteHeka = sobreFlete;
    respuestaCotizacion.detalles.comision_heka = sobreFlete; // Se llena con los detalles de la transportadora 
}

/** Realiza el cálculo del sobreflete de heka y retorna la cantidad que se va a cobrar en dicha comisión */
function calcularSobrefleteHeka(solicitudCotizacion, respuestaCotizacion, preciosPersonalizados) {
    const isConvencional = solicitudCotizacion.tipo === CONVENCIONAL;

    let comision_heka = preciosPersonalizados.comision_heka;
    let constante_heka = preciosPersonalizados.constante_pagoContraentrega;
    let valor = respuestaCotizacion.detalles.seguro;
    

    if(isConvencional) {
        constante_heka = preciosPersonalizados.constante_convencional;
        comision_heka = 1;
        valor = 0;
    }

    let sobrefleteHeka = Math.ceil(valor * ( comision_heka ) / 100) + constante_heka;

    return sobrefleteHeka;
}

/**Funcionalidad que se activa con la solicitud de cotizar por flexii para añadir la comisión impuesta por flexii */
function agregarComisionAdicionalFlexii(respuestaCotizacion) {
    const detalles = respuestaCotizacion.detalles;

    console.log(detalles);

    // comisión adicional viene dada por la probabilidad de cuantas guía se devuelven en promedio (de cada diez guía, se devuelven 3)
    const comisionHekaAdicional = Math.round((detalles.costoDevolucion*3)/7);

    // Se guarda la original (por si acaso)
    detalles.comisionHekaOriginal = respuestaCotizacion.sobrefleteHeka;

    // Se guarda el adicional qu eha sido agregado
    detalles.comisionHekaAdicional = comisionHekaAdicional;

    // Se añade el nuevo flete a la comisión de heka
    respuestaCotizacion.sobrefleteHeka += comisionHekaAdicional;
    respuestaCotizacion.detalles.comision_heka += comisionHekaAdicional; 

    // Se añade la nueva comisión al costo del envío
    respuestaCotizacion.costoEnvio += comisionHekaAdicional
    respuestaCotizacion.detalles.total += comisionHekaAdicional

    // Se actualiza la comisión Heka con sumándole el adicional
    return comisionHekaAdicional;
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