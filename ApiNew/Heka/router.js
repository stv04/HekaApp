const { auth, datosDeUsuario } = require("./controllers");

const express = require("express");
const router = express.Router();

router.get("/Usuario/:id", auth, datosDeUsuario);

module.exports = router;