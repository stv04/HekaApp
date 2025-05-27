const express = require("express");
const { listarEstados, actualizarEstado, agregarEstado } = require("./controller");
const router = express.Router();

router.get("/", listarEstados);
router.patch("/:id", actualizarEstado);
router.post("/:id", agregarEstado);

module.exports = router;