const express = require("express");
const { cotizar } = require("./controllers");
const { auth } = require("../Heka/controllers");
const router = express.Router();

router.post("/Cotizar", auth, cotizar);

module.exports = router;