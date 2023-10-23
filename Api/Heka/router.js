const { cotizar, auth, cotizarTransportadora } = require("./controllers");

const express = require("express");
const router = express.Router();

router.post("/Cotizar", auth, cotizar);
router.post("/Cotizar/:transportadora", auth, cotizarTransportadora);

module.exports = router;