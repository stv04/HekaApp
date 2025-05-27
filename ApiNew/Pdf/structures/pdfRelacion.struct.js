module.exports = (envios, aditionalData) => {
    const {fecha, receptor, fondo, logoHeka} = aditionalData;
    const primerEnvio = envios[0];
    const numerosGuia = envios.map(g => g.numeroGuia);
    
    const filasNumGuia = [];
    const nombreUsuario = primerEnvio.info_origen.nombre_completo;

    numerosGuia.forEach((numeroGuia, i) => {
        const lastN = filasNumGuia.length - 1;
        const esImpar = i % 2 === 0;

        const current = filasNumGuia[lastN];
        if(esImpar) {
            filasNumGuia.push([{text: numeroGuia}, {}]);
        } else {
            current[1] = {text: numeroGuia};
        }
    });

    return {
        pageSize: 'A4',
        header: {
            image: "logoHeka",
            height: 25,
            width: 100,
            alignment: "right",
            margin: [5, 20]
        },
        footer: {
            text: 'atencion@hekaentrega.co', alignment: 'center' 
        },
        background: {
            image: "fondo",
            alignment: "center",
            height: 280,
            width: 280,
            margin: [0, 300]
        },
        content: [
            {
                margin: [0, 30],
                table: {
                    widths: ["*", "*"],
                    body: [
                        [{
                            colSpan: 2,
                            text: "Relación de despachos",
                            fillColor: '#000',
                            alignment: "center",
                            color: "#fff",
                            bold: true,
                            fontSize: 14
                        }, {}],
                        [
                            {
                                text: [{text: "Nombre: ", bold: true}, nombreUsuario],
                            },
                            {
                                text: [{text: "Fecha: ", bold: true}, fecha],
                            }
                        ],
                        ...filasNumGuia,
                        [
                            {
                                text: `Envíos: ${envios.length}\n Receptor: ${receptor}`,
                                text: [
                                    {text: "Envíos: ", bold: true}, envios.length, 
                                    {text: "\nReceptor: ", bold: true}, receptor
                                ],
                                fontSize: 14,
                                colSpan: 2
                            }
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
        },
        images: {
            fondo: fondo,
            logoHeka: logoHeka
        }

    }
}