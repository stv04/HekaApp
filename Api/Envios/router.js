const { crearEnvio, agregarSeguimiento, obtenerSeguimiento } = require("./controllers");

const express = require("express");
const { obtenerEstados } = require("./network");
const router = express.Router();

router.post("/Nuevo", crearEnvio);
router.post("/seguimiento/:idEnvio", agregarSeguimiento);
router.get("/seguimiento/:idEnvio", obtenerSeguimiento);

module.exports = router;