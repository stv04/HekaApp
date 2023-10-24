const { doc, getDoc } = require("firebase/firestore");
const { db } = require("../../storage/firebase");
const { ThrowError, ThrowSpecifiedError } = require("../../Network/responses");
const { getOne } = require("../Ciudades/network");
const { transportadoras, COD_SERVIENTREGA, COD_INTERRAPIDISIMO, codigosError, CONTRAENTREGA, COD_ENVIA } = require("../../config/constantes");
const { cotizarServi, calcularPreciosAdicionalesServientrega } = require("../Servientrega/network");
const { cotizarInter, calcularPreciosAdicionalesInterrapidisimo } = require("../Inter/network");

const datos_personalizados = {
    costo_zonal1: 8650,
    costo_zonal2: 13300,
    costo_zonal3: 2800,
    costo_nacional1: 11500,
    costo_nacional2: 20400,
    costo_nacional3: 3400,
    costo_especial1: 25550,
    costo_especial2: 39000,
    costo_especial3: 6300,
    comision_servi: 3.1,
    comision_heka: 1.5,
    constante_convencional: 800,
    constante_pagoContraentrega: 1700,
    comision_punto: 10,
    saldo: 0
};

// objeto base que importa todas la funciones para cotizar por trasportadora 
const cotizacionesDisponibLes = {
    [COD_SERVIENTREGA]: cotizarServi,
    [COD_INTERRAPIDISIMO]: cotizarInter
}


/* Maneja el proceso de obtención de cotizaciones por transportadoras y ciudad. */
exports.cotizador = async (reqCotizacion) => {
    // Se busca primero la ciudad destino para analizar disponibilidad
    const ciudadDestino = await getOne(reqCotizacion.idDaneCiudadDestino);

    // si se encuentra bloqueada, retorna error porque significa que para la ciudad proporcionada no hay disponibilidad
    if(ciudadDestino.bloqueada) ThrowSpecifiedError(codigosError.C001);

    
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

    if(!ciudadDestino) ThrowSpecifiedError(codigosError.C005);
    // la cotizzación debería manejar la variables de la transportadora, para conocer la seleccionada
    const t = reqCotizacion.transportadora;

    // Si la ciudad destino se encuentra bloqueada retorna error
    if(ciudadDestino.bloqueada) ThrowSpecifiedError(codigosError.C001);

    // Obtenemos las configuraciones dadas para la transportadora en dicha ciudad
    const configTransportadoraPorCiudad = ciudadDestino.transportadoras[t];

    // Si la ciudad destino se encuentra bloqueada devuelve error en la cotización
    if(configTransportadoraPorCiudad && configTransportadoraPorCiudad.bloqueada) 
        ThrowSpecifiedError(codigosError.C002);

    // Analiza también las configuraciones propias de las transportadoras y retorna error en caso que no cumpla con las condiciones
    if(!transportadoras[t] || transportadoras[t].bloqueada === true)
        ThrowSpecifiedError(codigosError.C003);

    // Se retorna error en caso de que entre las cotizaciones disponibles no exista un función encargada de cotizar
    if(!cotizacionesDisponibLes[t])
        ThrowSpecifiedError(codigosError.C004);

    const cotizadorTransportadora = cotizacionesDisponibLes[t];

    // finalmente se procede a cotizar para devolver dicho resultado
    const response = await cotizadorTransportadora(reqCotizacion);

    return response;

}

/* Se encarga de recuperar los datos personalizados para
la cotización de un usuario. */
exports.obtenerValoresCotizacion = async (headers) => {
    // Variable en la que se almacena la autenticación obtenida por el header
    const autenticacion = headers.authentication;
    
    // Si nada es retornado en el header reporta que se debe autenticar el usuario
    if(!autenticacion) ThrowError("Se debe autenticar el usuario");

    const coll = doc(db, "usuarios", autenticacion);

    const d = await getDoc(coll);

    // Si el usuairo no existe, también devuelve error de autenticación
    if(!d.exists()) ThrowError("Autenticación inválida, usuario no encontrado", 404);

    const infoEncontrada = d.data().datos_personalizados;

    // Iteración que analiza todos los datos parametrizados para el usuario y dependiento del tipo de valor lo convierte, para evitar errores
    Object.keys(infoEncontrada).forEach(k => {
        const valor = infoEncontrada[k];
        if(typeof valor === "string" && /^-?\d+(.\d+)?$/.test(valor)) {
            const valorConvertido = valor.includes(".") ? parseFloat(valor) : parseInt(valor);
            infoEncontrada[k] = valorConvertido;
        }

        if(valor === "") {
            delete infoEncontrada[k];
        }
    });

    const parametros = Object.assign({}, datos_personalizados, infoEncontrada);

    // Fianlmente se devuelven los datos de cotización para un usuario en concreto
    return parametros;
}

/* Modifica la respuesta de una cotización agregando
información adicional y calculando precios adicionales en base a los parámetros proporcionados. */
exports.modificarRespuestaCotizacion = (solicitudCotizacion, cotizaciones, parametros) => {
    cotizaciones.forEach(c => {
        c.habilitada = transportadoras[c.transportadora].habilitada(parametros);
        switch(c.transportadora) {
            case COD_SERVIENTREGA:
                calcularPreciosAdicionalesServientrega(solicitudCotizacion, c, parametros);
            break;
            case COD_INTERRAPIDISIMO: 
                calcularPreciosAdicionalesInterrapidisimo(solicitudCotizacion, c, parametros);
            break;
            default:
            break;
        }

        if(solicitudCotizacion.tipo === CONTRAENTREGA) {
            sumarCostoDeEnvio(solicitudCotizacion, c);
        }
        
    });

    return cotizaciones;
}

function destallesCotizacion(consultaCotizacion, respuestaCotizaicon, personalizacionPrecios) {
    return {
        peso_real: consultaCotizacion.peso,
        flete: respuestaCotizaicon.flete,
        comision_heka: sobreFleteHeka(consultaCotizacion.recaudo, personalizacionPrecios.comision_heka),
        comision_trasportadora: respuestaCotizaicon.sobreflete + respuestaCotizaicon.seguroMercancia,
        // peso_liquidar: this.kgTomado,
        // peso_con_volumen: this.pesoVolumen,
        // total: this.costoEnvio,
        // recaudo: this.recaudo,
        // seguro: this.seguro,
        // costoDevolucion: this.costoDevolucion
    }
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

  // ciclo para asegurar que el valor de recaudo insertado no sea mayor a lo que se le va a pagar al usuario
  while (valorRecaudo > Math.round(detalles.recaudo - cotizacion.costoEnvio) && counter < 10) {
    detalles.recaudo = Math.round(valorRecaudo + cotizacion.costoEnvio);
    detalles.seguro =
      cotizacion.transportadora === COD_ENVIA ? detalles.seguro : detalles.recaudo;
    
    counter++;
  }
}