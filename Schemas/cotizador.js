const z = require("zod");

const SchCotizar = z.object({
    peso: z.number(), // El peso indicado del paquete
    alto: z.number(), 
    largo: z.number(),
    ancho: z.number(),
    valorSeguro: z.number(), // tiene que ver con el valor en el que se declara el producto (seguro de mercancía)
    valorRecaudo: z.number(), // tiene que ver con el valor que se le va a solicitar en un envío no convencional
    idDaneCiudadOrigen: z.string(), // id Código dane de la ciudad de origen
    idDaneCiudadDestino: z.string(), // id Código dane de la ciudad de destino
    tipo: z.string(), // Tipo de cotización (pago contraentrega, convencional, común)
});

module.exports = {SchCotizar}