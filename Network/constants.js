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


const tiposDeCotizacion = {
    URBAN: "URBAN",
    DEPARTAMENTAL: "DEPARTAMENTAL",
    NACIONAL: "NACIONAL",
    ESPECIAL: "ESPECIAL"
}

const estadosRecepcion = {
    neutro: "NEUTRO", // Este estado no se debería guarda en base de datos, ya que será una forma de ifltrar todas las guías
    recibido: "RECIBIDO", // Cuando el Qr Ha sido escaneado
    validado: "VALIDADO", // Cuando el operador ha validado la guía
    empacado: "EMPACADO", // Cuando el pedido ha sido generado
    novedad: "NOVEDAD", // Cuando el envío posee una novedad que necesita ser resuelta bien sea por el destinatario o remitenta
    novedad_op: "NOVEDAD OPERATIVA", // Cuando el envío posee una novedad que no necesita ser diligenciada por remitentne ni destinatario
    devuelto: "DEVOLUCION", // Cuando el pedido ha sido devuelto (entregado al remitente)
    entregado: "ENTREGADO", // Cuando el mensajero ha entregado el paquete
    reparto: "REPARTO", // Cuando el mensajero indica que está repartiendo el paquete
    bodega: "EN BODEGA", // Cuando el mensajero ha dejado el paquete en alguna dirección de referencia Heka
}

const tiposEnvio = {
    CONTRAENTREGA: "PAGO DESTINO",
    PAGO_CONTRAENTREGA: "PAGO CONTRAENTREGA",
    CONVENCIONAL: "CONVENCIONAL",
}



module.exports = {datos_personalizados, tiposDeCotizacion, estadosRecepcion, tiposEnvio}