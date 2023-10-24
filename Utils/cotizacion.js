const { transportadoras } = require("../config/constantes");

/* La función `exports.costoDevolucion` está calculando el costo de devolución de un envío en base a
los parámetros `datosParametrizados` y `respuestaCotizacion`. */
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

/* Se utiliza para validar si el peso de un envío supera el
límite de peso establecido por una empresa de transporte específica. */
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

/* Está calculando el volumen de un envío en base a las
dimensiones proporcionadas en el objeto `consultaCotizacion`. Multiplica el alto
(`consultaCotizacion.alto`), el ancho (`consultaCotizacion.ancho`) y el largo
(`consultaCotizacion.largo`) para obtener el volumen total del envío. */
exports.calcularVolumen = (consultaCotizacion) => consultaCotizacion.alto * consultaCotizacion.ancho * consultaCotizacion.largo;

/* La función `exports.calcularValorSeguro` calcula el valor del seguro para un envío en función de los
parámetros proporcionados `seguro` (valor del seguro), `transportadora` (empresa de transporte) y
`peso` (peso). */
exports.calcularValorSeguro = (seguro, transportadora, peso) => {
    const configuracion = transportadoras[transportadora];
    return Math.max(seguro, configuracion.limitesValorDeclarado(peso)[0]);
}

/**
 * Calcula el coste de una devolución formulada en base a una
 * lista de fórmulas, una estructura de fórmulas y una empresa de transporte.
 * @param formulas - El parámetro `fórmulas` es una cadena que representa una lista de fórmulas
 * separadas por "--". Cada fórmula está en el formato "transportadora: expresión", donde
 * "transportadora" es una cadena que representa el nombre de una empresa de transporte y "expresión"
 * es una expresión matemática que puede incluir
 * @param estructuraFormula - El parámetro `estructuraFormula` es un objeto que representa la
 * estructura de la fórmula. Contiene pares clave-valor donde la clave es el elemento de la fórmula y
 * el valor es el valor correspondiente a ese elemento.
 * @param transportadora - El parámetro `transportadora` representa el nombre de la empresa de
 * transporte.
 * @returns el coste de la devolución formulada, calculado en base a las fórmulas dadas, la estructura
 * de la fórmula y la empresa de transporte.
 */
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