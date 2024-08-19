module.exports = guia => {
    const {tipo, numeroGuia, info_destino, info_origen, valorRecaudo} = guia;

    return {
        pageSize: 'A5',
        pageOrientation: 'landscape',
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
                        ["Guía", numeroGuia],
                        [{
                            text: [
                                { text: 'DE: ', bold: true },
                                info_origen.nombre_completo + '\n',
                                info_origen.direccion + '\n\n',
                                `BOGOTÁ(CUNDINAMARCA), TEL: 1231231231`
                            ]
                        }, {
                            rowSpan: 2,
                            qr: numeroGuia
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
                                `Doc. si Valor a recaudar: en TARJETA o Efectivo ${valorRecaudo}\n\n`,
                                { text: 'Ref: ', bold: true },
                                'My reference'
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
        }

    }
}