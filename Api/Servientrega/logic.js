const fetch = import("node-fetch");
const { UsuarioPrueba, Credenciales } = require("./keys");

exports.cotizar = async (cotizador) => {
  
    const data = {
      IdProducto: 2,
      NumeroPiezas: 1,
      Piezas: [
        {
          Peso: cotizador.peso < 3 ? 3 : cotizador.peso,
          Largo: cotizador.largo,
          Ancho: cotizador.ancho,
          Alto: cotizador.alto,
        },
      ],
      ValorDeclarado: cotizador.valorDeclarado,
      IdDaneCiudadOrigen: cotizador.idDaneCiudadOrigen,
      IdDaneCiudadDestino: cotizador.idDaneCiudadDestino,
      EnvioConCobro: cotizador.tipo != "CONVENCIONAL",
      FormaPago: 2,
      TiempoEntrega: 1,
      // MEDIO DE TRANSPORTE COD 1 = TERRESTRE
      MedioTransporte: 1,
      NumRecaudo: cotizador.valorDeclarado,
    };

  //  return res.json(data)
    console.log("COTIZANDO SERVIENTREGA");
    const response = await fetch(
      "http://web.servientrega.com:8058/CotizadorCorporativo/api/Cotizacion",
      {
        method: "POST",
        headers: {
          "Content-Type": "Application/json",
          Authorization: body.EnvioConCobro?Credenciales.PgCon.Token:Credenciales.Conv.Token
        },
        body: JSON.stringify(data),
      }
    )
    .then((data) => {
      console.log("SERVIENTREGA RESPONDE");
      return data.json();
    })
    .catch((error) => {
      console.log(error);
      console.log("errorsinho");
    })
    .finally(() => {
      console.log("FINALIZÓ PROCESO COTIZACIÓN")
    });
  
    console.log("FINALIZÓ EL COTIZADOR SERVIENTREGA");
    return response;
};