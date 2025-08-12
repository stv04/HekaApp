const { doc, getDoc, getDocs, runTransaction, collection, updateDoc, increment, setDoc, addDoc, query, orderBy, where, limit } = require("firebase/firestore");
const { db } = require("../../storage/firebase");
const { ThrowError, ThrowSpecifiedError } = require("../../Network/responses");
const { getOne } = require("../Ciudades/network");
const { COD_SERVIENTREGA, COD_INTERRAPIDISIMO, CONTRAENTREGA, COD_ENVIA, COD_COORDINADORA, CONVENCIONAL } = require("../../config/constantes");
const { cotizarServi, calcularPreciosAdicionalesServientrega } = require("../Servientrega/network");
const { cotizarInter, calcularPreciosAdicionalesInterrapidisimo } = require("../Inter/network");
const { cotizarCoord, calcularPreciosAdicionalesCoordinadora } = require("../Coordinadora/network");
const transportadoras = require("../../config/transportadoras");
const respuestasError = require("../../Network/respuestasError");
const config = require("../../config/config");

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

        const padStart = config.ENVIRONMENT === "dev" ? "P-1000000" : "1000000000";
        console.log(config.ENVIRONMENT, padStart);
        return realCount.toString().padStart(10, padStart);
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
        return envio.exists() ? envio.data() : null;

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

exports.actualizarEnvio = async (idEnvio, data) => {
    try {
        const document = doc(collectionEnvios, idEnvio);
    
        const envio = await updateDoc(document, data);
        
        return envio;

    } catch (e) {
        ThrowError(e.message, 500);
    }
}

exports.enviosMensajeroPorEstadoRecepcion = async (userId, statuses) => {
    try {
        const q = query(
            collectionEnvios, 
            where("id_punto", "==", userId), 
            where("estado_recepcion", "in", statuses)
        );

        const envios = await getDocs(q);
        
        return envios.docs.map(d => {
            const data = d.data();
            data.id = d.id;
            return data;
        });

    } catch (e) {
        ThrowError(e.message, 500);
    }
}

exports.obtenerEnvioByNumeroGuia = async (numeroGuia) => {
    try {
        const dataCollection = collectionEnvios;
    
        const q = query(dataCollection, where("numeroGuia", "==", numeroGuia));
        const envios = await getDocs(q);

        if(!envios.size) return null;
        
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

exports.obtenerUltimoEstado = async (idEnvio) => {
    try {
        const dataCollection = collection(collectionEnvios, idEnvio, "estados");
    
        const q = query(dataCollection, orderBy("timeline", "desc"), limit(1));
        const envios = await getDocs(q);
        
        return envios.size ? envios.docs[0].data() : null;s
    } catch (e) {
        ThrowError(e.message, 500);
    }
}


exports.actualizarRutaEntrega = async (idUser, data) => {
    const docGestion = doc(db, "rutaEntrega", idUser);

    return updateDoc(docGestion, data);
}

exports.crearRutaEntrega = async (idUser, data) => {
    const docGestion = doc(db, "rutaEntrega", idUser);

    return setDoc(docGestion, data);
}

exports.obtenerRutaEntrega = async (idUser) => {
    const docGestion = doc(db, "rutaEntrega", idUser);

    const envio = await getDoc(docGestion);
        
    return envio.exists ? envio.data() : null;
} 

exports.rutaEntregaGuia = async (numeroGuia) => {
    numeroGuia = numeroGuia.toString();
    const collGestion = collection(db, "rutaEntrega");

    const q = query(collGestion, where("guias", "array-contains", numeroGuia), limit(1));
    const ruta = await getDocs(q);
    
    return ruta.size ? ruta.docs[0].data() : null;
}

exports.envioARuta = envio => {
    return {
        id: envio.id,
        numeroGuia: envio.numeroGuia,
        direccion: envio.esDevolucion ? envio.info_origen.direccion : envio.info_destino.direccion,
        estado: envio.estado,
        estado_recepcion: envio.estado_recepcion,
        location: envio.esDevolucion ? envio.info_origen.location : envio.info_destino.location
    }
}