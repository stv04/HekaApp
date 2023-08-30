const { cotizar, auth } = require("./controllers");

const express = require("express");
const router = express.Router();

router.post("/Cotizar", auth, cotizar);

module.exports = router;