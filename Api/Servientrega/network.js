const { calcularVolumen, calcularValorSeguro, costoDevolucion, validarPesoIngresado } = require("../../Utils/cotizacion");
const { COD_SERVIENTREGA, transportadoras, CONTRAENTREGA, CONVENCIONAL } = require("../../config/constantes");
const { getOne } = require("../Ciudades/network");
const { UsuarioPrueba, Credenciales } = require("./keys");
const fetch = require("node-fetch");

exports.cotizarServi = async (consultaCotizacion) => {

  const configuracion = transportadoras[COD_SERVIENTREGA];
  const recaudo = consultaCotizacion.valorRecaudo;
  const seguro = recaudo ?? consultaCotizacion.valorSeguro;
  const factor_conversion = 222 / 1e6;
  
  const pesoObstuso = validarPesoIngresado(consultaCotizacion.peso, COD_SERVIENTREGA);
  if(pesoObstuso) return pesoObstuso;
  
  const volumen = calcularVolumen(consultaCotizacion);
  const pesoVolumen = Math.ceil(volumen * factor_conversion);
  const peso = Math.max(consultaCotizacion.peso, configuracion.limitesPeso[0], pesoVolumen);
  let valorSeguro = calcularValorSeguro(seguro, COD_SERVIENTREGA, peso);

  if(consultaCotizacion.tipo === CONTRAENTREGA) valorSeguro = 0;

  const detallesAlCotizar = {
    peso_real: consultaCotizacion.peso,
    peso_liquidar: peso,
    peso_con_volumen: pesoVolumen,
    recaudo: recaudo,
    seguro: valorSeguro,

    flete: null, // Se llena al cotizar
    comision_heka: null, // Se llena con los detalles de la transportadora
    comision_trasportadora: null, // Se llena al final
    total: null, // Se llena con el resultado del costo de costoEnvio,
    costoDevolucion: null // Se llena luego con el algoritmo de calculo de costo devolución
  }

  const data = {
    IdProducto: 2,
    NumeroPiezas: 1,
    Piezas: [
      {
        Peso: peso,
        Largo: consultaCotizacion.largo,
        Ancho: consultaCotizacion.ancho,
        Alto: consultaCotizacion.alto,
      },
    ],
    ValorDeclarado: valorSeguro,
    IdDaneCiudadOrigen: consultaCotizacion.idDaneCiudadOrigen,
    IdDaneCiudadDestino: consultaCotizacion.idDaneCiudadDestino,
    EnvioConCobro: consultaCotizacion.tipo != "CONVENCIONAL",
    FormaPago: 2,
    TiempoEntrega: 1,
    // MEDIO DE TRANSPORTE COD 1 = TERRESTRE
    MedioTransporte: 1,
    NumRecaudo: valorSeguro,
  };

//  return res.json(data)
  const response = await fetch(
    "http://web.servientrega.com:8058/CotizadorCorporativo/api/Cotizacion",
    {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
        Authorization: data.EnvioConCobro?Credenciales.PgCon.Token:Credenciales.Conv.Token
      },
      body: JSON.stringify(data),
    }
  )
  .then((data) => {
    return data.json();
  })
  .catch((error) => {
    console.log(error);
    console.log("errorsinho");
  })

  if(response.Message) {
    return {
      error: true,
      message: response.Message,
      details: response.ModelState
    }
  }
  const [ciudadOrigen, ciudadDestino] = await Promise.all([getOne(consultaCotizacion.idDaneCiudadOrigen), getOne(consultaCotizacion.idDaneCiudadDestino)])
  .then(ciudades => ciudades.map(c => c.transportadoras[COD_SERVIENTREGA]));


  console.log(response);

  const valoresCotizacion = {
    transportadora: COD_SERVIENTREGA, // código de la transportadora
    tiempoEntrega: tiempoEntrega(ciudadOrigen, ciudadDestino), // Tiempo probable de entrega
    flete: response.ValorFlete, // El costo del flete otorgado por la transportadora
    sobreflete: response.ValorSobreFlete,
    detalles: detallesAlCotizar
  }
  
  return valoresCotizacion;
};

exports.calcularPreciosAdicionalesServientrega = (solicitudCotizacion, respuestaCotizacion, preciosPersonalizados) => {
  const isConvencional = solicitudCotizacion.tipo === CONVENCIONAL;

  let sobreflete_min = 3000;
  let comision_transp = 1.5;
  let comision_heka = preciosPersonalizados.comision_heka;
  let constante_heka = preciosPersonalizados.constante_pagoContraentrega;
  let seguroMercancia = 0;
  let valor = solicitudCotizacion.valorSeguro;

  if(isConvencional) {
    sobreflete_min = 350;
    comision_transp = 1;
    comision_heka = 1;
    constante_heka = preciosPersonalizados.constante_convencional;
    valor = 0;

    seguroMercancia = respuestaCotizacion.sobreflete;

  }
  // COSTO DE ENVÍO: flete + el resto de sobrefletes
  // SOBREFLETES:
  //  - sobreflete: Sobre flete calculado par ala transportadora de forma manual ( si es convencional pasa a ser cero)
  //  - seguro mercancía: Si es convencional, pasa a ser sobre flete, de otra forma es cero
  //  - sobreflete heka: viene dada por el cálculo de comision heka y contrante heka que varía si el envío es convencional o no

  let sobreflete = isConvencional
    ? 0 // Al ser convencional el sobreflete pasa a ser cero
    : Math.ceil(Math.max(solicitudCotizacion.valorSeguro * comision_transp / 100, sobreflete_min));

  let sobrefleteHeka = Math.ceil(valor * ( comision_heka ) / 100) + constante_heka;
  
  respuestaCotizacion.sobreflete = sobreflete;
  respuestaCotizacion.seguroMercancia = seguroMercancia;
  respuestaCotizacion.sobrefleteHeka = sobrefleteHeka;
  respuestaCotizacion.costoEnvio = sobreflete + seguroMercancia + sobrefleteHeka + respuestaCotizacion.flete;

  //#region  LLENANDO DETALLES
  const detalles = {
    flete: respuestaCotizacion.flete, // Se llena al cotizar
    comision_heka: respuestaCotizacion.sobrefleteHeka, // Se llena con los detalles de la transportadora
    comision_trasportadora: respuestaCotizacion.sobreflete + respuestaCotizacion.seguroMercancia, // Se llena al final
    total: respuestaCotizacion.costoEnvio, // Se llena con el resultado del costo de costoEnvio,
    costoDevolucion: costoDevolucion(preciosPersonalizados, respuestaCotizacion) // Se llena luego con el algoritmo de calculo de costo devolución
  }

  console.log(detalles);
  respuestaCotizacion.detalles = {...respuestaCotizacion.detalles, ...detalles};
  // #endregion

  return respuestaCotizacion;
}

function tiempoEntrega(c_origen, c_destino) {
  const trayecto = revisarTrayecto(c_origen, c_destino);
  switch(trayecto) {
    case "Urbano":
      return "1-2";
    case "Especial":
      return "5-8";
    default:
      return "2-3";
    
  }
}

function revisarTrayecto(c_origen, c_destino){
  if(c_destino.tipo_trayecto == undefined) return "NA";

  if(c_destino.tipo_trayecto == "TRAYECTO ESPECIAL"){
      return "Especial";
  } else {
      if(c_destino.id == c_origen.id) {
          return "Urbano";
      } else if(c_destino.departamento == c_origen.departamento) {
          return "Zonal";
      } else {
          return "Nacional";
      }
  }
};