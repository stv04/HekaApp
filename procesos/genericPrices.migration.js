const { doc, addDoc, setDoc, collection, query, where, getDocs } = require("firebase/firestore");
const genericPrices = require("../Network/genericPrices");
const { db } = require("../storage/firebase");
const fs = require("fs");


migrateCodeFirst();
async function migrateCodeFirst() {
    for(const price of genericPrices) {
        if(price.id) {
            const document = doc(db, "preciosUsuarios", price.id);
            await setDoc(document, price);
        } else {
            const document = collection(db, "preciosUsuarios");
            await addDoc(document, price);
        }
    }

    await migrateDbFirst();
}

// migrateDbFirst();
async function migrateDbFirst() {
    const priceByUserRef = collection(db, "preciosUsuarios");
    const qPreciosDefault = query(priceByUserRef, where("id_user", "==", "_DEFAULT"));
    const dataPreciosDefault = await getDocs(qPreciosDefault);
    const defaultPrices = dataPreciosDefault.docs.map(d => {
        const data = d.data();
        data.id = d.id;
        return data;
    });

    const path = "./Network/genericPrices.struct.js";
    fs.writeFileSync(path, "module.exports = ".concat(JSON.stringify(defaultPrices, null, "\t")));
    console.log("Precios extraidos de base de datos en " + path);

    process.exit();
}

