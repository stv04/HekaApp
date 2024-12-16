module.exports = guia => {
    const {id, tipo, numeroGuia, info_destino, info_origen, valorRecaudoText, fondo, logoHeka} = guia;

    return {
        pageSize: 'A5',
        pageOrientation: 'landscape',
        footer: {
            text: 'atencion@hekaentrega.co', alignment: 'center' 
        },
        background: {
            image: "fondo",
            alignment: "center",
            height: 280,
            width: 280,
            margin: [0, 70]
        },
        content: [
            {
                table: {
                    widths: ["*", "auto"],
                    body: [
                        [{
                            colSpan: 2,
                            text: tipo,
                            fillColor: '#000',
                            alignment: "center",
                            color: "#fff",
                            bold: true
                        }, {}],
                        [
                            {
                                text: [
                                    { text: "Guía: ", bold: true },
                                    numeroGuia
                                ],
                                fontSize: 15,
                                alignment: "center",
                                marginTop: 4
                            },
                            {
                                image: "logoHeka",
                                height: 20,
                                width: 80,
                                alignment: "center",
                                margin: [0, 4]
                            }
                        ],
                        [{
                            text: [
                                { text: 'DE: ', bold: true },
                                info_origen.nombre_completo + '\n',
                                info_origen.direccion + '\n\n',
                                `BOGOTÁ(CUNDINAMARCA), TEL: 1231231231`
                            ]
                        }, {
                            rowSpan: 2,
                            qr: `https://admin.hekaentrega.co/plataforma2.html?id=${id}#flexii_guia_recept`
                        }],
                        [{
                            text: [
                                { text: 'PARA: ', bold: true },
                                info_destino.nombre_completo + '\n',
                                info_destino.direccion + '\n\n',
                                'CUCUTA(NORTE DE SANTANDER), TEL: 1231231231'
                            ]
                        }],
                        [{
                            colSpan: 2,
                            text: [
                                { text: 'Observaciones cliente:\n', bold: true },
                                `Doc. si Valor a recaudar: en QR o Efectivo\t`,
                                { text: `${valorRecaudoText}\n\n`, bold: true, fontSize: 20 }
                            ]
                        }]
                    ]
                }
            }
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 16,
                bold: true,
                margin: [0, 10, 0, 5]
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
        defaultStyle: {
            alignment: 'justify'
        },
        images: {
            fondo: fondo,
            logoHeka: logoHeka
        }
    }
}