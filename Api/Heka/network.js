const { doc, getDoc, collection, query, where, getDocs } = require("firebase/firestore");
const { db } = require("../../storage/firebase");
const { ThrowError, ThrowSpecifiedError } = require("../../Network/responses");
const { getOne } = require("../Ciudades/network");
const { COD_SERVIENTREGA, COD_INTERRAPIDISIMO, CONTRAENTREGA, COD_ENVIA, COD_COORDINADORA, CONVENCIONAL } = require("../../config/constantes");
const { cotizarServi, calcularPreciosAdicionalesServientrega } = require("../Servientrega/network");
const { cotizarInter, calcularPreciosAdicionalesInterrapidisimo } = require("../Inter/network");
const { cotizarCoord, calcularPreciosAdicionalesCoordinadora } = require("../Coordinadora/network");
const transportadoras = require("../../config/transportadoras");
const respuestasError = require("../../Network/respuestasError");
const paquetePrecios = require("../../Network/genericPrices");

// objeto base que importa todas la funciones para cotizar por trasportadora 
const cotizacionesDisponibLes = {
    [COD_SERVIENTREGA]: cotizarServi,
    [COD_INTERRAPIDISIMO]: cotizarInter,
    [COD_COORDINADORA]:cotizarCoord
}


/* Maneja el proceso de obtención de cotizaciones por transportadoras y ciudad. */
exports.cotizador = async (reqCotizacion) => {
    // Se busca primero la ciudad destino para analizar disponibilidad
    const ciudadDestino = await getOne(reqCotizacion.idDaneCiudadDestino);

    // si se encuentra bloqueada, retorna error porque significa que para la ciudad proporcionada no hay disponibilidad
    if(ciudadDestino.bloqueada) ThrowSpecifiedError(respuestasError.C001);

    
    /* Está recuperando las claves del objeto
    `transportadoras` dentro del objeto `ciudadDestino`. y está almacenando sus variables. */
    const transportadorasActivasCiudadDestino = Object.keys(ciudadDestino.transportadoras);

    // función encargada de filtrar aquellas tranpsortadora activas según su ciudad destino o las propias configuraciones de las transportadoras
    const transportadorasCiudad = transportadorasActivasCiudadDestino.filter(t => (
        ciudadDestino.transportadoras[t].bloqueada !== true  // Se validad que la transportadora no esté bloqueada para la ciudad destino
        && cotizacionesDisponibLes[t] // Se valida que se tenga una función disponible para cotizar con x transportadora
        && transportadoras[t] && transportadoras[t].bloqueada !== true // y se valida que internamente la transportadora no esté bloqueada
    ));

    // Finalmente procedo a usar solo los cotizadores de las trasnportadoras debidamente activas
    const transportadorasActivas = transportadorasCiudad.map(t => cotizacionesDisponibLes[t](reqCotizacion));
    
    // La promesa me devolvería una lista con los respectivos resultados de cada una
    // Segmentando las correctas de los errores, para retornarlo como resultado
    const cotizaciones = await Promise.all(transportadorasActivas);
    const response = {
        resultado: cotizaciones.filter(c => !c.error),
        errores: cotizaciones.filter(c => c.error)
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

/* Se encarga de recuperar los datos personalizados para
la cotización de un usuario. */
exports.getUserData = async (headers) => {
    // Variable en la que se almacena la autenticación obtenida por el header
    const autenticacion = headers.authentication;
    
    // Si nada es retornado en el header reporta que se debe autenticar el usuario
    if(!autenticacion) ThrowError("Se debe autenticar el usuario");

    const coll = doc(db, "usuarios", autenticacion);

    const d = await getDoc(coll);

    // Si el usuairo no existe, también devuelve error de autenticación
    if(!d.exists()) ThrowError("Autenticación inválida, usuario no encontrado", 404);

    return d.data();
}

/* Se encarga de recuperar los datos personalizados para
la cotización de un usuario. */
exports.obtenerValoresCotizacion = (preciosPersonalizados) => {
    // Iteración que analiza todos los datos parametrizados para el usuario y dependiento del tipo de valor lo convierte, para evitar errores
    Object.keys(preciosPersonalizados).forEach(k => {
        const valor = preciosPersonalizados[k];
        if(typeof valor === "string" && /^-?\d+(.\d+)?$/.test(valor)) {
            const valorConvertido = valor.includes(".") ? parseFloat(valor) : parseInt(valor);
            preciosPersonalizados[k] = valorConvertido;
        }

        if(valor === "") {
            delete preciosPersonalizados[k];
        }
    });

    const parametros = Object.assign({}, datos_personalizados, preciosPersonalizados);

    // Fianlmente se devuelven los datos de cotización para un usuario en concreto
    return parametros;
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




async function getDefaultPrices() {
    const priceByUserRef = collection(db, "preciosUsuarios");
    const qPreciosDefault = query(priceByUserRef, where("id_user", "==", "_DEFAULT"));
    const dataPreciosDefault = await getDocs(qPreciosDefault);
    const defaultPrices = dataPreciosDefault.docs.map(d => d.data());
    return defaultPrices;
}

exports.getPricesByUser = async (id_user) => {
    const defaultPrices = await getDefaultPrices();
    if(!id_user) return defaultPrices;

    const priceByUserRef = collection(db, "preciosUsuarios");
    const qPreciosUser = query(priceByUserRef, where("id_user", "==", id_user));

    const dataPreciosUser = await getDocs(qPreciosUser);

    const pricesUser = dataPreciosUser.docs.map(d => {
        const price = d.data();
        const indexMatch = defaultPrices.findIndex(def => def.pesoMin === price.pesoMin && def.pesoMax === price.pesoMax && def.tipoCotizacion === price.tipoCotizacion && def.tipoEnvio === price.tipoEnvio);

        if(indexMatch !== -1) {
            const defaultMatch = defaultPrices.splice(indexMatch, 1)[0];
            return Object.assign({}, defaultMatch, price);
        }

        return price;
    });

    return pricesUser.concat(defaultPrices);
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