const { doc, getDoc, collection, query, where, getDocs } = require("firebase/firestore");
const { db } = require("../../storage/firebase");
const { ThrowError } = require("../../Network/responses");

/* Se encarga de recuperar los datos personalizados para
la cotización de un usuario. */
exports.getUserData = async (headers) => {
    // Variable en la que se almacena la autenticación obtenida por el header
    const autenticacion = headers.authentication;
    
    // Si nada es retornado en el header reporta que se debe autenticar el usuario
    if(!autenticacion) ThrowError("Se debe autenticar el usuario");

    const coll = doc(db, "usuarios", autenticacion);

    const d = await getDoc(coll);

    // Si el usuairo no existe, también devuelve error de autenticación
    if(!d.exists()) ThrowError("Autenticación inválida, usuario no encontrado", 404);

    return d.data();
}


async function getDefaultPrices() {
    const priceByUserRef = collection(db, "preciosUsuarios");
    const qPreciosDefault = query(priceByUserRef, where("id_user", "==", "_DEFAULT"));
    const dataPreciosDefault = await getDocs(qPreciosDefault);
    const defaultPrices = dataPreciosDefault.docs.map(d => d.data());
    return defaultPrices;
}

exports.getPricesByUser = async (id_user) => {
    const defaultPrices = await getDefaultPrices();
    if(!id_user) return defaultPrices;

    const priceByUserRef = collection(db, "preciosUsuarios");
    const qPreciosUser = query(priceByUserRef, where("id_user", "==", id_user));

    const dataPreciosUser = await getDocs(qPreciosUser);

    const pricesUser = dataPreciosUser.docs.map(d => {
        const price = d.data();
        const indexMatch = defaultPrices.findIndex(def => def.pesoMin === price.pesoMin && def.pesoMax === price.pesoMax && def.tipoCotizacion === price.tipoCotizacion && def.tipoEnvio === price.tipoEnvio);

        if(indexMatch !== -1) {
            const defaultMatch = defaultPrices.splice(indexMatch, 1)[0];
            return Object.assign({}, defaultMatch, price);
        }

        return price;
    });

    return pricesUser.concat(defaultPrices);
}