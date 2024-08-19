const PdfPrinter = require("pdfmake");
const path = require("path");
const { RSuccess, RCatchError } = require("../../Network/responses");
const { fontDescriptors } = require("./fonts/config");
const { obtenerEnvioByNumeroGuia } = require("../Envios/network");
const pdfEnviosStruct = require("./structures/pdfEnvios.struct");


/* Función asincrónica que maneja una solicitud para realizar una cotización. */
exports.pdfGuia = async (req, res) => {
    try {
        const { numeroGuia } = req.params;
                
        const guia = await obtenerEnvioByNumeroGuia(numeroGuia);
        const dd = pdfEnviosStruct(guia);

        const printer = new PdfPrinter(fontDescriptors);
        const doc = printer.createPdfKitDocument(dd);
        const chunks = [];
        let result;
        
        doc.on("data", chunk => {
            chunks.push(chunk);
        });

        doc.on("end", () => {
            result = Buffer.concat(chunks);
            RSuccess(req, res, result.toString("base64"));
        });
        
        doc.end();

    } catch (e) {
        console.log(e);
        RCatchError(req, res, e);
    }
}
