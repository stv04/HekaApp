const { calcularVolumen, calcularValorSeguro, validarPesoIngresado, costoDevolucion } = require("../../Utils/cotizacion");
const { estandarizarFecha } = require("../../Utils/funciones");
const { COD_INTERRAPIDISIMO, CONTRAENTREGA, CONVENCIONAL, transportadoras } = require("../../config/constantes");
const { pathCotizar } = require("./keys");

exports.cotizarInter = async (consultaCotizacion) => {
    // #region Procedimiento pre cotizar
    const factor_de_conversion = 1 / 6000;

    const configuracion = transportadoras[COD_INTERRAPIDISIMO];

    const pesoObstuso = validarPesoIngresado(consultaCotizacion.peso, COD_INTERRAPIDISIMO);
    if(pesoObstuso) return pesoObstuso;

    const recaudo = consultaCotizacion.valorRecaudo;
    const seguro = recaudo ?? consultaCotizacion.valorSeguro;

    const volumen = calcularVolumen(consultaCotizacion);
    const pesoVolumen = Math.ceil(volumen * factor_de_conversion);
    const peso = Math.max(consultaCotizacion.peso, configuracion.limitesPeso[0], pesoVolumen);
    let valorSeguro = calcularValorSeguro(seguro, COD_INTERRAPIDISIMO, peso);

    if(consultaCotizacion.tipo === CONTRAENTREGA) valorSeguro = 0;
    // #endregion

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

    let res = await fetch(pathCotizar
        +7986+ "/"
        +consultaCotizacion.idDaneCiudadOrigen+"/"
        +consultaCotizacion.idDaneCiudadDestino+"/"
        +peso+"/"
        +valorSeguro+"/1/" 
        + estandarizarFecha(new Date(), "DD-MM-YYYY")
    )
    .then(data => data.json())
    .catch(err => err);

    if(res.message || res.Message) return {
        error: true,
        message: "No se consolidó la cotización"
    };

    let mensajeria = res.filter(d => d.IdServicio === 3 || d.IdServicio === 6);

    if(!mensajeria.length) return {
        error: true,
        message: "No se consigue la cotización correspondiente al id servicio"
    };

    const precio = res[0].Precio;

    let sobreflete = 0;
    if(consultaCotizacion.type != CONVENCIONAL) {
        let servicioContraPago;
        if(valorSeguro > 50000) {
            servicioContraPago = valorSeguro * 0.03;
        } else {
            servicioContraPago = 2500
        }
        sobreflete = Math.ceil(servicioContraPago);
    }

    return {
        transportadora: COD_INTERRAPIDISIMO,
        tiempoEntrega: res[0].TiempoEntrega,
        seguroMercancia: Math.ceil(valorSeguro * 0.02),
        sobreflete: sobreflete,
        flete: precio.Valor,
        detalles: detallesAlCotizar
    }
}

exports.calcularPreciosAdicionalesInterrapidisimo = (solicitudCotizacion, respuestaCotizacion, preciosPersonalizados) => {
    let comision_heka = preciosPersonalizados.comision_heka;
    let constante_heka = preciosPersonalizados.constante_pagoContraentrega;
    let valor = solicitudCotizacion.valorSeguro;
  
    let sobrefleteHeka = Math.ceil(valor * ( comision_heka ) / 100) + constante_heka;
    if(solicitudCotizacion.tipo !== CONVENCIONAL) sobrefleteHeka += 1000; 
    
    respuestaCotizacion.sobrefleteHeka = sobrefleteHeka;
    respuestaCotizacion.costoEnvio = respuestaCotizacion.sobreflete 
        + respuestaCotizacion.seguroMercancia 
        + sobrefleteHeka 
        + respuestaCotizacion.flete;

  
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