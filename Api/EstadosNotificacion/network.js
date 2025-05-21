const { query, where, getDocs, collection } = require("firebase/firestore");
const { db } = require("../../storage/firebase");

const coleccionEstados = collection(db, "estadosNotificacion");
exports.listaEstados = async () => {
    try {
        const q = query(coleccionEstados, where("transportadora", "==", "HEKA"));
        const envios = await getDocs(q);

        return envios.docs.map(d => d.data());

    } catch (e) {
        ThrowError(e.message, 500);
    }
}
