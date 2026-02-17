const { collection, getDocs, query, getDoc, doc } = require("firebase/firestore");
const { db } = require("../storage/firebase");

updateTransmitterReceiver();
async function updateTransmitterReceiver() {
    const coll = collection(db, 'envios');
    const docs = await getDocs(coll);
    
    const size = docs.size;

    const report = {
        transmitters:0,
        receivers: 0,
        analized: 0,
        totalCount: 0,
        no_status: 0,
        duration: 0,
        updated: 0
    };
    const initial = Date.now();

    const close = () => {
        report.totalCount++;
        if(report.totalCount && report.totalCount % 100 === 0)
            console.log(`Proccesed ${report.totalCount} of ${size}`);

        if(report.totalCount === size) {
            const final = Date.now();
            const duration = final - initial;
            report.duration = duration;
            console.log('The process have been finished. ' + parseInt(duration / 1000));
            console.log(report);
            process.exit();
        }
    }

    docs.forEach(async (d) => {
        const data = d.data();
        if(data.mensajero_receptor && data.mensajero_emisor) return close();

        const collDocs = collection(db, d.ref.path, 'estados');
        const statusDocs = await getDocs(collDocs);
        
        if(!statusDocs.size) {
            report.no_status++;
            return close();
        }
        const statuses = statusDocs.docs.map(dd => dd.data());
        const [firstStatus] = statuses;
        const lastStatus = statuses.find(es => es.tipo === 'ENTREGADO');

        const transmitter = !data.mensajero_emisor ? await getCostCenter(firstStatus.reporter) : null;
        const receiver = !data.mensajero_receptor && lastStatus?.reporter 
            ? await getCostCenter(lastStatus.reporter) 
            : null;

        const dataToUpdate = {};

        if(transmitter) {
            dataToUpdate.mensajero_emisor = transmitter;
            report.transmitters++;
        }

        if(receiver) {
            dataToUpdate.mensajero_receptor = receiver;
            report.receivers++;
        }

        report.analized++;

        close();

    })
}

const costCenterList = new Map();
async function getCostCenter(idUser) {
    if(!costCenterList.has(idUser)) {
        const collUser = doc(db, 'usuarios', idUser);
        const userData =  await getDoc(collUser);
        costCenterList.set(idUser, userData.exists() ? userData.data().centro_de_costo : null);
    }
    
    return costCenterList.get(idUser);
}