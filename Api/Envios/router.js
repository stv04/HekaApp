const { crearEnvio, agregarSeguimiento, obtenerSeguimiento, actualizarRuta, obtenerRutasMensajero, obtenerRuta } = require("./controllers");

const express = require("express");
const { obtenerEstados } = require("./network");
const router = express.Router();

router.post("/Nuevo", crearEnvio);
router.post("/Seguimiento/:idEnvio", agregarSeguimiento);
router.get("/Seguimiento/:idEnvio", obtenerSeguimiento);

router.get("/RutaEntrega/mensajero/:idUser", obtenerRutasMensajero);
router.get("/RutaEntrega/:numeroGuia", obtenerRuta);
router.patch("/RutaEntrega/:idUser", actualizarRuta);

module.exports = router;