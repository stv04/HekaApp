const PdfPrinter = require("pdfmake");
const path = require("path");
const { RSuccess, RCatchError } = require("../../Network/responses");
const { fontDescriptors } = require("./fonts/config");
const { obtenerEnvioByNumeroGuia, obtenerEnvio } = require("../Envios/network");
const pdfEnviosStruct = require("./structures/pdfEnvios.struct");
const pdfRelacionStruct = require("./structures/pdfRelacion.struct");
const { getOne } = require("../Ciudades/network");


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

exports.pdfRelacionEnvio = async (req, res) => {
    try {
        const { ids } = req.body;

        const envios = [];

        for (const id of ids) {
            const envio = await obtenerEnvio(id);
            envios.push(envio);
        }

        const infoCiudadOrigen = await getOne(envios[0].idDaneCiudadOrigen);
        const nombreCiudad = `${infoCiudadOrigen.ciudad} (${infoCiudadOrigen.departamento})`;

        const aditionalData = {
            ...req.body,
            ciudadOrigen: nombreCiudad
        };
                
        const dd = pdfRelacionStruct(envios, aditionalData);

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