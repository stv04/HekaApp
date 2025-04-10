const { tiposDeCotizacion } = require("./constants");

const configuracionBase = {
    porcentajeComision: .015, // Porcentaje en base al valor de recaudo (expresado en decimales)
    porcentajeSeguroMercancia: .01, // Porcentaje en base al valor declarado del producto (expresado en decimales)
    comisionMinima: 0 // La comision qu ese establece como mínimo para las que no sean convencionales
}

module.exports = [{
    ...configuracionBase,
    id_user: "_DEFAULT", // id del usuario o default para los precios por defecto
    id: "ZHOeITkdrZUIS19ZKI9F", // Id de la colección firebase
    porcentajeComision: 0.02, // Porcentaje par ala comisión de pago contraentrega
    constanteComision: 0, // Constante que se suma a la comisión calculada del porcentaje
    minimaComision: 0, // mínimo valor permitido de comisión
    porcentajeSeguroMercancia: 0.02, // Porcentaje para la comisión con respecto al seguro de mercancía
    constanteSeguroMercancia: 900, // Constante que se suma a la comisión calculada del porcentaje (con el seguro de mercancía)
    minimoSeguroMercancia: 0, // Mínima comisión con respecto al seguro de mercancía
    pesoMin: 1, // Peso mínimo permitido para la configuración
    pesoMax: 3, // Peso máximo permitido para la configuración
    precioBase: 6300, // Precio base del flete
    precioKgAdicional: 0, // En caso de que haya Kg adicionales al mínimo, es el precio que se le suma
    tipoCotizacion: tiposDeCotizacion.URBAN // El tipo de cotización para el que aplica
}, {
    ...configuracionBase,
    id: "jsz5UY9byb4fNeETGz5P", 
    id_user: "_DEFAULT",
    porcentajeComision: 0.04,
    constanteComision: 0,
    minimaComision: 0, 
    porcentajeSeguroMercancia: 0,
    constanteSeguroMercancia: 900,
    minimoSeguroMercancia: 0,
    pesoMin: 1,
    pesoMax: 5,
    precioBase: 10150,
    precioKgAdicional: 4200,
    tipoCotizacion: tiposDeCotizacion.NACIONAL
}];