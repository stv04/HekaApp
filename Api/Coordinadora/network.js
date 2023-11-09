const xml2js = require("xml2js");
const { DOMParser } = require("xmldom");
const MaquetadorXML = require("../../Utils/maquetadorXML");
const fetch = require("node-fetch");

const credentials  = require("./keys");
const { calcularValorSeguro, validarPesoIngresado, costoDevolucion } = require("../../Utils/cotizacion");
const {  normalizarValoresNumericos } = require("../../Utils/funciones");
const { COD_COORDINADORA, CONTRAENTREGA, CONVENCIONAL } = require("../../config/constantes");
const transportadoras = require("../../config/transportadoras");

async function servicioCotizar(cotizacion) {
    const maquetador = new MaquetadorXML("./Api/Coordinadora/maquetas/cotizar.coord.xml");
    const {v15, nit, div} = credentials;
    const peticion = Object.assign({
        nit: nit,
        div: div,
        apikey: v15.apikey,
        clave: v15.clave,
        unidades: 1,
        ubl: 0,
        cuenta: 2 // Codigo de la cuenta, 1 = Cuenta Corriente, 2 = Acuerdo semanal, 3 = Flete Pago
    }, cotizacion);

    const itemXml = maquetador.maqueta("ITEMS").fill(peticion);

    peticion.items = itemXml;

    const structure = maquetador.maqueta("COTIZADOR").fill(peticion);

    try {
        const response = await fetch(v15.endpoint, {
            method: "POST",
            Headers: {"Content-Type": "text/xml"},
            body: structure
        })
        .then(d => {
            console.log("status => ", d.status);
            // if(d.status >= 400) return {respuesta: "Error de servidor"}
            return d.text();
        })
        .catch(e => {
            console.log(e.message);
        })
    
        let xmlResponse = new DOMParser().parseFromString(response, "text/xml");
        const getSpecificXml = (dom) => xmlResponse.documentElement.getElementsByTagName(dom);
        const resCotizar = getSpecificXml("Cotizador_cotizarResult");
        let responseJson = await xml2js.parseStringPromise(resCotizar, {
            explicitArray: false,
            ignoreAttrs: true
        });

        if(responseJson) {
            responseJson = normalizarValoresNumericos(responseJson.Cotizador_cotizarResult);
        }

        // obtener el método faultString
        if(!responseJson) {
            const stringFault = "SOAP-ENV:Fault";
            fault = await xml2js.parseStringPromise(getSpecificXml(stringFault), {
                explicitArray: false,
                ignoreAttrs: true
            });

            responseJson = fault[stringFault];
            responseJson.error = true;
        }
    
    
        return responseJson || {
            error: true,
            message: "Problemas de comunicación"
        };
    } catch (e){
        return {
            error: true,
            message: e.message
        }
    }
}

/* Se encarga de calcular el costo de envío y otros detalles de un
envío determinado utilizando el servicio de transporte de Coordinadora. */
exports.cotizarCoord = async (consultaCotizacion) => {
    // #region Procedimiento pre cotizar
    const configuracion = transportadoras[COD_COORDINADORA];

    const pesoObstuso = validarPesoIngresado(consultaCotizacion.peso, COD_COORDINADORA);
    if(pesoObstuso) return pesoObstuso;
    
    const recaudo = consultaCotizacion.valorRecaudo;
    const seguro = consultaCotizacion.valorSeguro;
    
    const peso = Math.max(consultaCotizacion.peso, configuracion.limitesPeso[0]);
    let valorSeguro = calcularValorSeguro(seguro, COD_COORDINADORA, peso);

    const data = {
        ciudad_origen: consultaCotizacion.idDaneCiudadOrigen,
        ciudad_destino: consultaCotizacion.idDaneCiudadDestino,
        largo: consultaCotizacion.largo,
        ancho: consultaCotizacion.ancho,
        alto: consultaCotizacion.alto,
        peso: peso,
        seguro: valorSeguro,
        valorProducto: recaudo,
    };

    // #endregion
    try {
        const res = await servicioCotizar(data);

        if(res.error) return res;

        if(!res || res.respuesta) return {
            error: true,
            message: "La transportadora no retorna ningún valor"
        }

        if(res.respuesta) return {
            error: true,
            message: res.respuesta
        }


        const detallesAlCotizar = {
            peso_real: peso,
            peso_liquidar: res.peso_liquidado,
            recaudo: recaudo,
            seguro: valorSeguro,
        
            flete: null, // Se llena al cotizar
            comision_heka: null, // Se llena con los detalles de la transportadora
            comision_trasportadora: null, // Se llena al final
            total: null, // Se llena con el resultado del costo de costoEnvio,
            costoDevolucion: null // Se llena luego con el algoritmo de calculo de costo devolución
        }
    
        // Si la guía es convencional, el sobre flete es cero, de otra forma, el sobreflete es el valor máximo entre:
        // el 2.65% del valor del seguro "valorSeguro" y 4300 pesos
        let sobreflete = 0;
        if(consultaCotizacion.tipo !== CONVENCIONAL) {
            sobreflete = Math.round(Math.max(valorSeguro * 0.0265, 4300));
        }
    
        return {
            transportadora: COD_COORDINADORA,
            tiempoEntrega: res.dias_entrega,
            seguroMercancia: res.flete_variable,
            sobreflete: sobreflete,
            flete: res.flete_fijo,
            detalles: detallesAlCotizar
        }
    } catch (e) {
        return {
            error: true,
            message: e.message
        }
    }


}

/* Calcula precios adicionales para el
servicio de transporte Inter Rapidisimo en base a la solicitud de cotización
(`solicitudCotizacion`), la respuesta de cotización (`respuestaCotizacion`) y los precios
personalizados (`preciosPersonalizados`). */
exports.calcularPreciosAdicionalesCoordinadora = (solicitudCotizacion, respuestaCotizacion, preciosPersonalizados) => {
    
    let {sobrefleteHeka} = respuestaCotizacion;
  
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
  
    respuestaCotizacion.detalles = {...respuestaCotizacion.detalles, ...detalles};
    // #endregion
  
    return respuestaCotizacion;
}