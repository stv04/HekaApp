const { doc, getDoc, getDocs, runTransaction, collection, updateDoc, increment, setDoc, addDoc } = require("firebase/firestore");
const { db } = require("../../storage/firebase");
const { ThrowError, ThrowSpecifiedError } = require("../../Network/responses");
const { getOne } = require("../Ciudades/network");
const { COD_SERVIENTREGA, COD_INTERRAPIDISIMO, CONTRAENTREGA, COD_ENVIA, COD_COORDINADORA, CONVENCIONAL } = require("../../config/constantes");
const { cotizarServi, calcularPreciosAdicionalesServientrega } = require("../Servientrega/network");
const { cotizarInter, calcularPreciosAdicionalesInterrapidisimo } = require("../Inter/network");
const { cotizarCoord, calcularPreciosAdicionalesCoordinadora } = require("../Coordinadora/network");
const transportadoras = require("../../config/transportadoras");
const respuestasError = require("../../Network/respuestasError");

exports.idGuia = async () => {
    // Obtenemos el id d ela información que tenemos actualmente
    try {

        const incrementalDoc = doc(db, "infoHeka", "heka_id");
        const collectionId = collection(incrementalDoc, "incrementalEnvios");
        const idList = await getDocs(collectionId);
        const counters = idList.size;
        
        let count = 0;
        for (const doc of idList.docs) {
            count += doc.get("count");
        }

        const incrementaId = Math.floor(Math.random() * counters);
        const incrementRef = idList.docs[incrementaId];
        await updateDoc(incrementRef.ref, {
            count: increment(1)
        });

        await updateDoc(incrementalDoc, {
            idEnvios: count
        });

        return count.toString().padStart(8, "10000000");
    } catch(e) {
        ThrowError(e.message, 500);
    }
}

exports.generarEnvio = async (guia) => {
    try {
        const dataCollection = collection(db, "envios")
    
        await addDoc(dataCollection, guia);

    } catch (e) {-
        ThrowError(e.message, 500);
    }
}

/* Maneja el proceso de obtención de cotizaciones por transportadoras y ciudad. */
exports.cotizador = async (reqCotizacion) => {
    const {alto, ancho,largo} = reqCotizacion;
    // Se busca primero la ciudad destino para analizar disponibilidad
    const ciudadDestino = await getOne(reqCotizacion.idDaneCiudadDestino);

    // si se encuentra bloqueada, retorna error porque significa que para la ciudad proporcionada no hay disponibilidad
    if(ciudadDestino.bloqueada) ThrowSpecifiedError(respuestasError.C001);

    const preciosDeCotizacion = ciudades[reqCotizacion.idDaneCiudadOrigen].preciosDestino[reqCotizacion.idDaneCiudadDestino];
    if(!preciosDeCotizacion) ThrowSpecifiedError(respuestasError.C006);
    
    reqCotizacion.pesoVolumetrico = pesoVolumetrico(alto*ancho*largo);
    reqCotizacion.pesoTomado = Math.ceil(Math.max(reqCotizacion.peso, reqCotizacion.pesoVolumetrico));
    const valorComision = reqCotizacion.tipo !== CONVENCIONAL ? Math.max(Math.ceil(reqCotizacion.valorRecaudo * configuracionBase.porcentajeComision), configuracionBase.comisionMinima) : 0;

    const response = {
        valorFlete: obtenerValorFlete(reqCotizacion.pesoTomado),
        sobreFlete: valorComision,
        seguroMercancia: reqCotizacion.valorSeguro * configuracionBase.porcentajeseguroMercancia,
        detalles: reqCotizacion
    }

    return response;
}