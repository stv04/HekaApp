const { doc, getDoc, getDocs, runTransaction, collection, updateDoc, increment, setDoc, addDoc, query, orderBy, where } = require("firebase/firestore");
const { db } = require("../../storage/firebase");
const { ThrowError, ThrowSpecifiedError } = require("../../Network/responses");
const { getOne } = require("../Ciudades/network");
const { COD_SERVIENTREGA, COD_INTERRAPIDISIMO, CONTRAENTREGA, COD_ENVIA, COD_COORDINADORA, CONVENCIONAL } = require("../../config/constantes");
const { cotizarServi, calcularPreciosAdicionalesServientrega } = require("../Servientrega/network");
const { cotizarInter, calcularPreciosAdicionalesInterrapidisimo } = require("../Inter/network");
const { cotizarCoord, calcularPreciosAdicionalesCoordinadora } = require("../Coordinadora/network");
const transportadoras = require("../../config/transportadoras");
const respuestasError = require("../../Network/respuestasError");

const collectionEnvios = collection(db, "envios");
let universalId = null;
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
        
        if(universalId && !isNaN(universalId)) {
            universalId++;
        } else {
            universalId = count;
        }

        const realCount = universalId ?? count;

        const incrementaId = Math.floor(Math.random() * counters);
        const incrementRef = idList.docs[incrementaId];
        await updateDoc(incrementRef.ref, {
            count: increment(1)
        });

        await updateDoc(incrementalDoc, {
            idEnvios: count
        });

        return realCount.toString().padStart(8, "10000000");
    } catch(e) {
        ThrowError(e.message, 500);
    }
}

exports.generarEnvio = async (guia) => {
    try {
        const dataCollection = collectionEnvios;
    
        const envio = await addDoc(dataCollection, guia);
        
        return envio.id;

    } catch (e) {
        ThrowError(e.message, 500);
    }
}

exports.obtenerEnvio = async (idEnvio) => {
    try {
        const dataCollection = doc(collectionEnvios, idEnvio);
    
        const envio = await getDoc(dataCollection);
        
        return envio.data();

    } catch (e) {
        ThrowError(e.message, 500);
    }
}

exports.obtenerEnvios = async () => {
    try {
        const dataCollection = collectionEnvios;
    
        const q = query(dataCollection, orderBy("timeline", "desc"));
        const envios = await getDocs(q);
        
        return envios.docs.map(d => d.data());

    } catch (e) {
        ThrowError(e.message, 500);
    }
}

exports.obtenerEnvioByNumeroGuia = async (numeroGuia) => {
    try {
        const dataCollection = collectionEnvios;
    
        const q = query(dataCollection, where("numeroGuia", "==", numeroGuia));
        const envios = await getDocs(q);

        const firstDoc = envios.docs[0];
        const data = firstDoc.data();
        data.id = firstDoc.id;
        
        return data;

    } catch (e) {
        ThrowError(e.message, 500);
    }
}

exports.guardarEstado = async (idEnvio, estado) => {
    try {
        const dataCollection = collection(collectionEnvios, idEnvio, "estados");
    
        const seguimiento = await addDoc(dataCollection, estado);

        return seguimiento.id;
    } catch (e) {
        ThrowError(e.message, 500);
    }
}

exports.obtenerEstados = async (idEnvio) => {
    try {
        const dataCollection = collection(collectionEnvios, idEnvio, "estados");
    
        const q = query(dataCollection, orderBy("timeline", "desc"));
        const envios = await getDocs(q);
        
        return envios.docs.map(d => d.data());

    } catch (e) {
        ThrowError(e.message, 500);
    }
}
