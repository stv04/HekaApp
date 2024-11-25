module.exports = {
    "C001": {
        code: "C001",
        message: "La ciudad destino no está dispoible para cotizar.",
        description: "La ciudad que se está tratando de cotizar se encuentra bloqueada y por lo tanto no se podrá cotizar con ninguna transportadora."
    },
    "C002": {
        code: "C002",
        message: "La transportadora no está habilitada para la ciudad",
        description: "Aunque la ciudad se encuentra activa de forma general, está bloqueada para una transportadora en concreto."
    },
    "C003": {
        code: "C003",
        message: "La transportadora no está disponible en estos momentos.",
        description: "La transportadora existe como parámetro, pero internamente está bloqueada."
    },
    "C004": {
        code: "C004",
        message: "La transportadora no está disponible en el cotizador",
        description: "La transportadora no ha sido parametrizada de ninguna forma sobre el cotizador."
    },
    "C005": {
        code: "C005",
        message: "La ciudad con la que se desea cotizar no existe",
        description: "El código dane que se intruduce no existe como Id en nuestra base de datos de ciudades."
    },
    "C006": {
        code: "C006",
        message: "La ciudad destino no está disponible para recepción de paquetes.",
        description: "La ciudad desde donde se plantea cotizar, no tiene el tipo de validez adecuado para recibir paquetes."
    },
    "C007": {
        code: "C007",
        message: "Valores no disponibles para la cotización deseada.",
        description: "Esto se debe a que entre los precios disponibles que se tiene para cotización, no se encuentra disponible alguno para el peso ingresado."
    },
    "C008": {
        code: "C008",
        message: "La ciudad desde dónde se requiere enviar no se encuentra disponible para envío.",
        description: "La ciudad de origen que se quiere validar no existe en la base de datos o no posee el tipo de validez adecuado para enviar paquetes."
    },
}