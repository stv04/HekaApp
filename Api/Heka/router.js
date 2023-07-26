const { cotizar } = require("./controllers");

const express = require("express");
const router = express.Router();

/**
 * @openapi
 * /Api/Heka/Cotizar:
 *  get:
 *      tags: 
 *          - Heka 
 *      summary: Cotizador heka
 *      description: Permite cotizar directamente con servientrega, devolviendo una lista de resultados
 *      responses:
 *          200:
 *              description: Devuelve la respuesta de cotización.
 */
router.get("/Cotizar", cotizar);
router.post("/Cotizar", cotizar);

module.exports = router;