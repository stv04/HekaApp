const express = require("express");
const router = express.Router();

const { listaCiudades, listaCiudadesCompleta, obtenerCiudad, ActualizarCiudad } = require("./controllers");

router.get("/", listaCiudadesCompleta);
router.patch("/", ActualizarCiudad);

router.get("/Lista", listaCiudades);
router.get("/CiudadDane/:dane", obtenerCiudad);

module.exports = router;