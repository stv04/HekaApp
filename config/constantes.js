const COD_SERVIENTREGA = "SERVIENTREGA";
const COD_INTERRAPIDISIMO = "INTERRAPIDISIMO";
const COD_ENVIA = "ENVIA";
const COD_TCC = "TCC";
const COD_COORDINADORA = "COORDINADORA";

exports.CONTRAENTREGA = "PAGO DESTINO";
exports.PAGO_CONTRAENTREGA = "PAGO CONTRAENTREGA";
exports.CONVENCIONAL = "CONVENCIONAL";

const codigosTransportadora = [COD_SERVIENTREGA, COD_INTERRAPIDISIMO, COD_ENVIA, COD_TCC, COD_COORDINADORA];

const transportadoras = {
    "SERVIENTREGA": {
        cod: COD_SERVIENTREGA,
        nombre: "Servientrega",
        limitesPeso: [3,80],
        limitesLongitud: [1,150],
        limitesRecaudo: [5000, 2000000],
        bloqueada: false,
        limitesValorDeclarado: (peso) => {
            return [5000,300000000]
        },
        habilitada: (datos_personalizados) => {
            const sist = datos_personalizados.sistema_servientrega;
            return sist && sist !== "inhabilitado";
        },
        valorMinimoEnvio: kg => 0
    },
    "INTERRAPIDISIMO": {
        cod: COD_INTERRAPIDISIMO,
        nombre: "Inter Rapidísimo",
        limitesPeso: [0.1, 80],
        limitesLongitud: [1,150],
        limitesRecaudo: [10000, 3000000],
        bloqueada: false,
        limitesValorDeclarado: (peso) => {
            if(peso <= 2) return [15000, 30000000]
            if(peso <= 5) return [30000, 30000000]
            return [40000, 4540000]
        },
        habilitada: (datos_personalizados) => {
            const sist = datos_personalizados.sistema_interrapidisimo;
            return sist && sist !== "inhabilitado";
        },
        valorMinimoEnvio: kg => {
            if(kg == 1) {
                return 15000;
            } else if(kg >= 3 && kg <= 5) {
                return 30000
            } else if(kg >= 6 && kg <= 37) {
                return 40000;
            } else {
                return 0;
            }
        }
    },
    "ENVIA": {
        cod: COD_ENVIA,
        nombre: "Envía",
        limitesPeso: [0.1,100],
        limitesLongitud: [1,150],
        limitesRecaudo: [10000, 3000000],
        bloqueada: false,
        limitesValorDeclarado: (valor) => {
            return [10000, 30000000]
        },
        habilitada: (datos_personalizados) => {
            const sist = datos_personalizados.sistema_envia;
            return sist && sist !== "inhabilitado";
        },
        valorMinimoEnvio: kg => 0
    },
    "TCC": {
        cod: COD_TCC,
        nombre: "TCC",
        limitesPeso: [0.1,100],
        limitesLongitud: [1,150],
        limitesRecaudo: [10000, 3000000],
        bloqueada: true,
        limitesValorDeclarado: (valor) => {
            if(valor <= 2) return [12500, 30000000]
            if(valor <= 5) return [27500, 30000000]
            return [37500, 30000000]
        },
        habilitada: (datos_personalizados) => {
            const sist = datos_personalizados.sistema_tcc;
            return sist && sist !== "inhabilitado";
        },
        valorMinimoEnvio: kg => 0
    },
    "COORDINADORA": {
        cod: COD_COORDINADORA,
        nombre: "Coordinadora",
        limitesPeso: [0.1,100],
        limitesLongitud: [1,150],
        limitesRecaudo: [10000, 3000000],
        bloqueada: false,
        limitesValorDeclarado: (valor) => {
            return [10000, 30000000]
        },
        habilitada: (datos_personalizados) => {
            const sist = datos_personalizados.sistema_coordinadora;
            return sist && sist !== "inhabilitado";
        },
        valorMinimoEnvio: kg => 0
    },
};

const codigosError = {
    "C001": {
        code: "C001",
        title: "La ciudad destino no está dispoible para cotizar.",
        description: "La ciudad que se está tratando de cotizar se encuentra bloqueada y por lo tanto no se podrá cotizar con ninguna transportadora."
    },
    "C002": {
        code: "C002",
        title: "La transportadora no está habilitada para la ciudad",
        description: "Aunque la ciudad se encuentra activa de forma general, está bloqueada para una transportadora en concreto."
    },
    "C003": {
        code: "C003",
        title: "La transportadora no está disponible en estos momentos.",
        description: "La transportadora existe como parámetro, pero internamente está bloqueada."
    },
    "C004": {
        code: "C004",
        title: "La transportadora no está disponible en el cotizador",
        description: "La transportadora no ha sido parametrizada de ninguna forma sobre el cotizador."
    },
}


module.exports = {
    transportadoras,
    codigosTransportadora,
    COD_COORDINADORA,
    COD_ENVIA,
    COD_INTERRAPIDISIMO,
    COD_SERVIENTREGA, COD_TCC,

    codigosError
}