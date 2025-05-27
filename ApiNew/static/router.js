const express = require("express");
const router = express.Router();

router.get("/Prueba", (req, res) => {
    res.send("Prueba Exitosa");
});

module.exports = router;