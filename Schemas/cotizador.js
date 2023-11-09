const i18next = require("i18next");
const z = require("zod");
const {zodI18nMap} = require("zod-i18n-map");
const translation = require("zod-i18n-map/locales/es/zod.json");

const { CONVENCIONAL, PAGO_CONTRAENTREGA, CONTRAENTREGA } = require("../config/constantes");

i18next.init({
    lng: "es",
    resources: {
        es: { zod: translation },
    }
});

z.setErrorMap(zodI18nMap);

const SchCotizar = z.object({
    peso: z.number(), // El peso indicado del paquete
    alto: z.number(), 
    largo: z.number(),
    ancho: z.number(),
    valorSeguro: z.number(), // tiene que ver con el valor en el que se declara el producto (seguro de mercancía)
    valorRecaudo: z.number(), // tiene que ver con el valor que se le va a solicitar en un envío no convencional
    idDaneCiudadOrigen: z.string(), // id Código dane de la ciudad de origen
    idDaneCiudadDestino: z.string(), // id Código dane de la ciudad de destino
    tipo: z.enum([CONVENCIONAL, PAGO_CONTRAENTREGA, CONTRAENTREGA]), // Tipo de cotización (pago contraentrega, convencional, común)
    sumarCostoEnvio: z.boolean() // Determina si en necesario sumar costo de envío sobre la cotización para apgo contraentrega
});

module.exports = {SchCotizar}