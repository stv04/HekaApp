const { collection, getDocs, doc, getDoc } = require("firebase/firestore");
const { db } = require("../../storage/firebase");
const { TrowError } = require("../../Network/responses");

let ciudades = [], ciudadesSimple = [];
async function obtenerCiudades() {
    const coll = collection(db, "ciudades")
    const snapshot = await getDocs(coll);

    console.log("CONSULTANDO CIUDADES NUEVAMENTE");

    const listaCiudades = snapshot.docs.map(d => d.data());
    
    ciudades = listaCiudades;
    
    ciudadesSimple = listaCiudades.filter(c => !c.desactivada)
    .map(c => ({
        nombre: c.nombre,
        dane_ciudad: c.dane_ciudad
    }));

    return ciudades;
}

async function ciudadesCotizador() {
    if(!ciudades.length) await obtenerCiudades();

    return ciudadesSimple
}

async function listaCompletaCiudades() {
    if(!ciudades.length) await obtenerCiudades();

    return ciudades;
}

async function update(dane_ciudad) {
    const ciudad = ciudades.find(c => c.dane_ciudad === dane_ciudad);

    if(!ciudad) throw new Error("No se consigue la ciudad que deseas editar");

    return true;
}

/**
 * La función `getOne` recupera datos de una ciudad específica de una base de datos de Firestore.
 * @param dane_ciudad - El parámetro "dane_ciudad" representa el identificador de la ciudad que estás
 * buscando en la colección "ciudades".
 * @returns los datos de la ciudad que se busca.
 */
async function getOne(dane_ciudad) {
    const coll = doc(db, "ciudades", dane_ciudad);
    const d = await getDoc(coll);

    if(!d.exists) TrowError("No se consigue la ciudad que estás buscando");

    return d.data();
}

async function cityStatistics(dane_ciudad) {
    const coll = collection(db, "ciudades", dane_ciudad, "estadisticasEntrega");
    const q = await getDocs(coll);

    return q.docs.map(d => d.data());
}

module.exports = {ciudadesCotizador, listaCompletaCiudades, update, getOne, cityStatistics}