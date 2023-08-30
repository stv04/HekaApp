const { transportadoras } = require("../config/constantes");

exports.costoDevolucion = (datosParametrizados, respuestaCotizacion) => {
    const estructuraFormulada = {
      F: respuestaCotizacion.flete, // Para el flete devuelto en la cotización
      CE: respuestaCotizacion.costoEnvio, // EL costo del envío
      SM: respuestaCotizacion.seguroMercancia, // El seguro de mercancía
      SF: respuestaCotizacion.sobreflete // El sobreflete
    }
  
    const transportadora = respuestaCotizacion.transportadora;
  
    const costoDevolucion = costoDevolucionFormulado(datosParametrizados.formula_devolucion, estructuraFormulada, transportadora)
    if(costoDevolucion) return costoDevolucion;
  
    switch(transportadora) {
        case transportadoras.SERVIENTREGA.cod:
            return respuestaCotizacion.costoEnvio;
        case transportadoras.INTERRAPIDISIMO.cod:
            return respuestaCotizacion.flete + respuestaCotizacion.seguroMercancia + respuestaCotizacion.sobreflete + 1000;
        case transportadoras.ENVIA.cod:
            return (respuestaCotizacion.flete + respuestaCotizacion.seguroMercancia + 1000) * 2;
        case transportadoras.COORDINADORA.cod:
            return (respuestaCotizacion.flete + respuestaCotizacion.seguroMercancia + 1000) * 2;
    }
}

exports.validarPesoIngresado = (peso, transportadora) => {
    const configuracion = transportadoras[transportadora];
    if(peso > configuracion.limitesPeso[1]) {
        return {
            error: true,
            transportadora: transportadora,
            message: "El peso exede el límite permitido por la transportadora"
        }
    }

    return false;
}

exports.calcularVolumen = (consultaCotizacion) => consultaCotizacion.alto * consultaCotizacion.ancho * consultaCotizacion.largo;

exports.calcularValorSeguro = (seguro, transportadora, peso) => {
    const configuracion = transportadoras[transportadora];
    return Math.max(seguro, configuracion.limitesValorDeclarado(peso)[0]);
}

function costoDevolucionFormulado(formulas, estructuraFormula, transportadora) {
    console.log(formulas);
    if(!formulas) return null;
    const listadoFormulas = formulas.split("--").map(v => v.trim().split(":"));
    if(!listadoFormulas.length) return null;

    const estructura = listadoFormulas.find(f => f[0] === transportadora);

    if(!estructura) return null;

    let respuesta = estructura[1];
    const regexp = /([A-Z]+)/g;

    let exp, c = 0;
    while(exp = regexp.exec(respuesta)) {
        c++;
        if(c >= 100) throw new Error("Alerta de bucle infinito");

        console.log(exp);
        const [expresion, item] = exp;

        const valor = estructuraFormula[item];
        respuesta = respuesta.replace(expresion, valor);   
    }

    console.log(respuesta);
    return eval(respuesta);
}