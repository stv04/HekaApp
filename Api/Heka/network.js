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

const cotizacionesDisponibLes = {
    [COD_SERVIENTREGA]: cotizarServi,
    [COD_INTERRAPIDISIMO]: cotizarInter
}



exports.cotizador = async (reqCotizacion) => {
    const ciudadOrigen = await getOne(reqCotizacion.idDaneCiudadOrigen);
    const ciudadDestino = await getOne(reqCotizacion.idDaneCiudadDestino);

    if(ciudadDestino.bloqueada) ThrowSpecifiedError(codigosError.C001);

    const transportadorasActivasCiudadDestino = Object.keys(ciudadDestino.transportadoras);
    const transportadorasCiudad = transportadorasActivasCiudadDestino.filter(t => (
        ciudadDestino.transportadoras[t].bloqueada !== true  // Se validad que la transportadora no esté bloqueada para la ciudad destino
        && cotizacionesDisponibLes[t] // Se valida que se tenga una función disponible para cotizar con x transportadora
        && transportadoras[t] && transportadoras[t].bloqueada !== true // y se valida que internamente la transportadora no esté bloqueada
    ));

    const transportadorasActivas = transportadorasCiudad.map(t => cotizacionesDisponibLes[t](reqCotizacion));

    const cotizaciones = await Promise.all(transportadorasActivas);
    const response = {
        resultado: cotizaciones.filter(c => !c.error),
        errores: cotizaciones.filter(c => c.error)
    }

    return response;
}

exports.cotizadorTransportadora = async (reqCotizacion) => {
    const ciudadDestino = await getOne(reqCotizacion.idDaneCiudadDestino);
    const t = reqCotizacion.transportadora;
    if(ciudadDestino.bloqueada) ThrowSpecifiedError(codigosError.C001);

    const configTransportadoraPorCiudad = ciudadDestino.transportadora[t];

    if(configTransportadoraPorCiudad && configTransportadoraPorCiudad.bloqueada) 
        ThrowSpecifiedError(codigosError.C002);

    if(transportadoras[t] && transportadoras[t].bloqueada === true)
        ThrowSpecifiedError(codigosError.C003);

    if(!cotizacionesDisponibLes[t])
        ThrowSpecifiedError(codigosError.C004);

    const cotizadorTransportadora = cotizacionesDisponibLes[t];

    const response = await cotizadorTransportadora(reqCotizacion);

    return response;

}

exports.obtenerValoresCotizacion = async (headers) => {
    const autenticacion = headers.authentication;
    
    if(!autenticacion) ThrowError("Se debe autenticar el usuario");

    
    const coll = doc(db, "usuarios", autenticacion);

    const d = await getDoc(coll);
    if(!d.exists()) ThrowError("Autenticación inválida, usuario no encontrado", 404);
    const infoEncontrada = d.data().datos_personalizados;
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

    return parametros;
}

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

function sumarCostoDeEnvio(solicitudCotizacion, cotizacion) {
  let counter = 0;
  const {detalles} = cotizacion;
//   return;
  const {valorRecaudo} = solicitudCotizacion;

  while (valorRecaudo > Math.round(detalles.recaudo - cotizacion.costoEnvio) && counter < 10) {
    detalles.recaudo = Math.round(valorRecaudo + cotizacion.costoEnvio);
    detalles.seguro =
      cotizacion.transportadora === COD_ENVIA ? detalles.seguro : detalles.recaudo;
    
    counter++;
  }
}