module.exports = guia => {
    const {id, tipo, numeroGuia, info_destino, info_origen, valorRecaudoText, fondo, logoHeka, aditionalData, observaciones, autoriza_inventario, dice_contener} = guia;
    
    const textObservaciones = observaciones ? `${observaciones}\n` : "";
    const textAutorizaInventario = autoriza_inventario ? "Remitente Autoriza inventario.\n" : "Remitente NO autoriza inventario.\n";
    const localidad = [info_destino.localidad ?? '', info_destino.barrio ?? ''].filter(Boolean).join(' - ');

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
                                `${aditionalData.nombreCiudadOrigen}, TEL: ${info_origen.celular}`
                            ]
                        }, {
                            rowSpan: 2,
                            fit: 200, // Tamaño del qr
                            qr: `https://admin.hekaentrega.co/plataforma2.html?id=${id}#flexii_guia_recept`
                        }],
                        [{
                            text: [
                                { text: 'PARA: ', bold: true },
                                info_destino.nombre_completo + '\n',
                                `Loc: ${localidad}\n`,
                                info_destino.direccion + '\n\n',
                                `${aditionalData.nombreCiudadDestino}, TEL: ${info_destino.celular}\n\n`,
                                { text: 'Contenido: ', bold: true },
                                dice_contener + "\n",
                                textAutorizaInventario
                            ]
                        }],
                        [{
                            colSpan: 2,
                            text: [
                                `Doc. si Valor a recaudar: en QR o Efectivo\t\t\t`,
                                { text: `${valorRecaudoText}\n`, bold: true, fontSize: 20 },
                                { text: 'Observaciones cliente:\n', bold: true },
                                textObservaciones,
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