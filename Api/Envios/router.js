const { crearEnvio } = require("./controllers");

const express = require("express");
const router = express.Router();

router.post("/Nuevo", crearEnvio);

module.exports = router;