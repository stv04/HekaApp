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
        message: "La ciudad destino no está disponible para la ciudad de origen ingresada.",
        description: "La combinación entre ciudad de origen y destino no están disponibles en nuestrabase de datos."
    },
    "C007": {
        code: "C007",
        message: "Valores no disponibles para la cotización deseada.",
        description: "Esto se debe a que entre los precios disponibles que se tiene para cotización, no se encuentra disponible alguno para el peso ingresado."
    },
}