const express = require("express");
const { generadorDeRutas } = require("../Utils/config");

const router = express.Router();

generadorDeRutas(__dirname, router, {
   excepciones: ["index.js", "static"],
   base: "Api"
});

module.exports = router;