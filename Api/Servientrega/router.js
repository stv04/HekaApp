const express = require("express");
const { cotizar } = require("./controllers");
const router = express.Router();

router.post("/Cotizar", cotizar);

module.exports = router;