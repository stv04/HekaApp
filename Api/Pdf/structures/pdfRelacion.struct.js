module.exports = (envios, aditionalData) => {
    const {ciudadOrigen, fecha, receptor} = aditionalData;
    const primerEnvio = envios[0];
    const numerosGuia = envios.map(g => g.numeroGuia);
    const filasNumGuia = [];
    const nombreUsuario = primerEnvio.info_origen.nombre_completo;

    numerosGuia.forEach((numeroGuia, i) => {
        const lastN = filasNumGuia.length - 1;
        const esImpar = i % 2 === 0;

        const current = filasNumGuia[lastN];
        if(esImpar) {
            filasNumGuia.push([{text: numeroGuia}, {}, {}, {}]);
        } else {
            current[2] = {text: numeroGuia};
        }
    });

    return {
        pageSize: 'A4',
        content: [
            {
                text: "Relación de despacho",
                style: "header"
            },
            {
                text: "¡Hola! te presentemos tu relación de despacho para su revisión y descarga",
                style: "subheader"
            },
            {
                table: {
                    widths: ["*", 20, "*", 20],
                    body: [
                        [
                            {
                                text: `Heka Entrega \n ${ciudadOrigen}`,
                                colSpan: 4,
                                alignment: "center",
                                fontSize: 14
                            }, {}, {}, {}
                        ],
                        [
                            {
                                text: `Nombre: ${nombreUsuario}`,
                                colSpan: 2
                            },
                            {},
                            {
                                text: `Fecha: ${fecha}`,
                                colSpan: 2
                            }
                        ],
                        ...filasNumGuia,
                        [
                            {
                                text: `Envíos: ${envios.length}\n Receptor: ${receptor}`,
                                colSpan: 4,
                                fontSize: 14
                            }, {}, {}, {}
                        ]
                    ]
                }
            }
        ],
        styles: {
            header: {
                fontSize: 24,
                bold: true,
                color: "blue",
                alignment: "center",
                margin: [0, 0, 0, 2]
            },
            subheader: {
                fontSize: 16,
                color: "blue",
                alignment: "center",
                margin: [0, 10, 0, 20]
            },
            tableExample: {
                margin: [0, 5, 0, 15]
            },
            tableHeader: {
                bold: true,
                fontSize: 13,
                color: 'black'
            }
        }

    }
}