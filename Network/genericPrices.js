const { tiposDeCotizacion, tiposEnvio } = require("./constants");

const configuracionBase = {
    porcentajeComision: 0.02, // Porcentaje par ala comisión de pago contraentrega
    constanteComision: 0, // Constante que se suma a la comisión calculada del porcentaje
    minimaComision: 0, // mínimo valor permitido de comisión
    porcentajeSeguroMercancia: 0.02, // Porcentaje para la comisión con respecto al seguro de mercancía
    constanteSeguroMercancia: 0, // Constante que se suma a la comisión calculada del porcentaje (con el seguro de mercancía)
    minimoSeguroMercancia: 0, // Mínima comisión con respecto al seguro de mercancía
}

module.exports = [{
    ...configuracionBase,
    id_user: "_DEFAULT", // id del usuario o default para los precios por defecto (QUEDARÁ OBSOLETO CON REFACTOR)
    id_usuario_firebase: "_DEFAULT", // id del usuario o default para los precios por defecto
    id: "ZHOeITkdrZUIS19ZKI9F", // Id de la colección firebase
    pesoMin: 1, // Peso mínimo permitido para la configuración
    pesoMax: 4, // Peso máximo permitido para la configuración
    precioBase: 8000, // Precio base del flete
    precioKgAdicional: 0, // En caso de que haya Kg adicionales al mínimo, es el precio que se le suma
    tipoEnvio: tiposEnvio.PAGO_CONTRAENTREGA,
    tipoCotizacion: tiposDeCotizacion.URBAN, // El tipo de cotización para el que aplica

    porcentajeComision: 0.04, // Porcentaje par ala comisión de pago contraentrega
    porcentajeSeguroMercancia: 0, // Porcentaje para la comisión con respecto al seguro de mercancía
}, {
    ...configuracionBase,
    id_user: "_DEFAULT", // id del usuario o default para los precios por defecto (QUEDARÁ OBSOLETO CON REFACTOR)
    id_usuario_firebase: "_DEFAULT", // id del usuario o default para los precios por defecto
    id: "WWcz4FbNgLPq7GndjBKm", // Id de la colección firebase
    pesoMin: 1, // Peso mínimo permitido para la configuración
    pesoMax: 4, // Peso máximo permitido para la configuración
    precioBase: 8900, // Precio base del flete
    precioKgAdicional: 0, // En caso de que haya Kg adicionales al mínimo, es el precio que se le suma
    tipoEnvio: tiposEnvio.CONVENCIONAL,
    tipoCotizacion: tiposDeCotizacion.URBAN, // El tipo de cotización para el que aplica

    porcentajeComision: 0, // Porcentaje par ala comisión de pago contraentrega
}, {
    ...configuracionBase,
    id_user: "_DEFAULT", // id del usuario o default para los precios por defecto (QUEDARÁ OBSOLETO CON REFACTOR)
    id_usuario_firebase: "_DEFAULT", // id del usuario o default para los precios por defecto
    id: "4wE5n1nh64nuzMmcV4a6", // Id de la colección firebase
    pesoMin: 1, // Peso mínimo permitido para la configuración
    pesoMax: 4, // Peso máximo permitido para la configuración
    precioBase: 8900, // Precio base del flete
    precioKgAdicional: 0, // En caso de que haya Kg adicionales al mínimo, es el precio que se le suma
    tipoEnvio: tiposEnvio.CONTRAENTREGA,
    tipoCotizacion: tiposDeCotizacion.URBAN, // El tipo de cotización para el que aplica

    porcentajeComision: 0, // Porcentaje par ala comisión de pago contraentrega
}, {
    ...configuracionBase,
    id: "jsz5UY9byb4fNeETGz5P", 
    id_user: "_DEFAULT",
    id_usuario_firebase: "_DEFAULT",
    pesoMin: 1,
    pesoMax: 4,
    precioBase: 12900,
    precioKgAdicional: 0,
    tipoEnvio: tiposEnvio.CONVENCIONAL,
    tipoCotizacion: tiposDeCotizacion.NACIONAL,

    porcentajeComision: 0
}, {
    ...configuracionBase,
    id_user: "_DEFAULT",
    id_usuario_firebase: "_DEFAULT",
    id: "8AXyvMRWByC1ZTgfxKbs",
    pesoMin: 1,
    pesoMax: 4,
    precioBase: 12900,
    precioKgAdicional: 0,
    tipoEnvio: tiposEnvio.CONTRAENTREGA,
    tipoCotizacion: tiposDeCotizacion.NACIONAL,

    porcentajeComision: 0
}, {
    ...configuracionBase,
    id_user: "_DEFAULT",
    id_usuario_firebase: "_DEFAULT",
    id: "wGdGAvJPcJLPXbhD70Ia",
    pesoMin: 1,
    pesoMax: 4,
    precioBase: 13900,
    precioKgAdicional: 0,
    tipoEnvio: tiposEnvio.PAGO_CONTRAENTREGA,
    tipoCotizacion: tiposDeCotizacion.NACIONAL,

    porcentajeComision: 0.029,
    porcentajeSeguroMercancia: 0
}];