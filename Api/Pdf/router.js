const { pdfGuia } = require("./controllers");

const express = require("express");
const router = express.Router();

router.get("/Envio/:numeroGuia", pdfGuia);

module.exports = router;