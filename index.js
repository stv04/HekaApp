const express = require("express");
const routers = require("./Api/index.js");
const swaggerDocs = require("./config/swagger.js");
const bodyParser = require("body-parser");
const cors = require("cors");

const port = process.env.PORT || 6201;
const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors({
    origin: [
        "http://localhost:6200", "https://hekaentrega.co", "https://flexii.co", "http://157.230.217.168:6200",
        "https://*.hekaentrega.co", "https://*.flexii.co"
    ]
}));

app.use("/Api", routers);

app.listen(port, () => {
    console.warn("Aplicación corriendo en http://localhost:" + port);
    swaggerDocs(app, port);
});