const i18next = require("i18next");
const z = require("zod");
const {zodI18nMap} = require("zod-i18n-map");
const translation = require("zod-i18n-map/locales/es/zod.json");

const { CONVENCIONAL, PAGO_CONTRAENTREGA, CONTRAENTREGA } = require("../config/constantes");
const { generarReferencia } = require("../Utils/swaggerGen");
const { SchCotizar } = require("./cotizador");

i18next.init({
    lng: "es",
    resources: {
        es: { zod: translation },
    }
});

z.setErrorMap(zodI18nMap);


const SchBasicDataEnvios = z.object({
    idDaneCiudadOrigen: z.string(), // id Código dane de la ciudad de origen
    idDaneCiudadDestino: z.string(), // id Código dane de la ciudad de destino
    tipo: z.enum([CONVENCIONAL, PAGO_CONTRAENTREGA, CONTRAENTREGA]),
    valorSeguro: z.number(),
    valorRecaudo: z.number(),
    largo: z.number(),
    ancho: z.number(),
    alto: z.number(),
    peso: z.number(),
    dice_contener: z.string(),
    centro_de_costo: z.string(),
    id_user: z.string().nullable(),
    observaciones: z.string(),
    info_origen: z.object({
        nombre_completo: z.string(),
        direccion: z.string(),
        celular: z.number(),
        numero_identificacion: z.string(),
        tipo_identificacion: z.string().nullable(),
    }),
    info_destino: z.object({
        nombre_completo: z.string(),
        direccion: z.string(),
        celular: z.number(),
        numero_identificacion: z.string(),
        tipo_identificacion: z.string().nullable(),
    }),
    info_cotizacion: z.object({
        valorFlete: z.number(),
        sobreFlete: z.number(),
        seguroMercancia: z.number(),
        pesoVolumetrico: z.number(),
        pesoTomado: z.number(),
    }).nullish()
});

// Utiliza d einformación base lo qeu viene del cotizador, para que el mismo generador de envíos utilice el cotizador por prevención
const SchNuevoEnvio = SchBasicDataEnvios.merge(SchCotizar);

const SchEstado = z.object({
    estado: z.string(),
    descripcion: z.string(),
    esNovedad: z.boolean(),
    observaciones: z.string().nullable(),
    ubicacion: z.string().nullable(),
    reporter: z.string()
});

function unwrap(schema, parent) {
    const dictionary = {
        ZodNumber: "integer",
        ZodString: "string",
        ZodObject: "object",
        ZodBoolean: "boolean",
        ZodNullable: "nullable",
        ZodDate: "date",
    }

    Object.keys(schema.shape).forEach(key => {
        const ref = schema.shape[key]
        if(ref._def.typeName === 'ZodObject') {
            parent[key] = {};
            // unwrap(ref.unwrap(), parent[key]);
            return;
        }

        parent[key] = {
            type: dictionary[ref._def.typeName]
        }
    })

    return parent;
}


// generarReferencia(SchNuevoEnvio);

module.exports = {SchNuevoEnvio, SchEstado}