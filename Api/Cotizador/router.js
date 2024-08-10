const { cotizar, auth, cotizarTransportadora } = require("./controllers");

const express = require("express");
const router = express.Router();

router.post("/", cotizar);

module.exports = router;