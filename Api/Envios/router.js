const { crearEnvio, agregarSeguimiento, obtenerSeguimiento } = require("./controllers");

const express = require("express");
const { obtenerEstados } = require("./network");
const router = express.Router();

router.post("/Nuevo", crearEnvio);
router.post("/Seguimiento/:idEnvio", agregarSeguimiento);
router.get("/Seguimiento/:idEnvio", obtenerSeguimiento);

module.exports = router;