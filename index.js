const express = require("express");
const routers = require("./Api/index.js");
const swaggerUI = require("swagger-ui-express");
const swaggerDocument = require("./config/swagger.json");
const swaggerDocs = require("./config/swagger.js");

const port = process.env.PORT || 6201;
const app = express();

app.use("/Api", routers);


app.listen(port, () => {
    console.warn("Aplicación corriendo en http://localhost:" + port);
    swaggerDocs(app, port);
});