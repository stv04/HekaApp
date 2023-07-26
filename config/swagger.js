const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const swaggerSpec = swaggerJsDoc({
    definition: {
        openapi: "3.0.0",
        info:  {
            title: "Heka App",
            version: "1.0.0"
        }
    },
    apis: ["./Api/**/router.js"]
});

function swaggerDocs(app, port) {
    // página de swagger
    app.use("/Api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

    // json generado
    app.use("/Api-docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });

    console.log("Documentación disponible en http://localhost:" + port + "/Api-docs");
}

module.exports = swaggerDocs;