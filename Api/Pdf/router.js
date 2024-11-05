const { pdfGuia, pdfRelacionEnvio } = require("./controllers");

const express = require("express");
const router = express.Router();

router.get("/Envio/:numeroGuia", pdfGuia);
router.post("/RelacionEnvios", pdfRelacionEnvio);

module.exports = router;