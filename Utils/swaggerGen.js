const fs = require("fs");

const swaggerDoc = require("../config/swagger.json");

const {paths: docPaths, components} = swaggerDoc;

//* Es importante que la "RespuestaGeneral" exista sobre el schema, para evitar errores
const respuestaGeneral = components.schemas.RespuestaGeneral;

function transformarParametroSwagger(path) {
    const route = path.split("/");
    const parametros = [];

    const parametrosFormateados = route.map(p => {
        if(p.startsWith(":")) {
            const nombreParam = p.replace(":", "");
            p = `{${nombreParam}}`;
            
            parametros.push({
                name: nombreParam,
                in: "path",
                required: true,
            });
        }

        return p;
    });

    const pathResultante = parametrosFormateados.join("/");
    return {
        ruta: pathResultante,
        parametros: parametros
    }
}

function agregarResponses(estructura) {
    estructura.responses = {
        200: {
            description: "mis respuestas por defecto",
            content: {
                "application/json": {
                    schema: respuestaGeneral
                }
            }
        }
    }

    return estructura;
}

function agregarRequestBody(estructura, metodo) {
    estructura.requestBody = {
        "description": "Se agrega requestBody genérico porque el método ingresado es de tipo: " + metodo,
        "content": {
          "application/json": {
            "schema": {
              "type": "body"
            }
          }
        },
        "required": true
    }

    return estructura;
}

const agregarRuta = (rutaOriginal, metodo, tags) => {
    const {ruta, parametros} = transformarParametroSwagger(rutaOriginal);
    const asignarRequestBody = ["post", "put"].includes(metodo);

    const estructuraBasica = {
        tags: tags,
        summary: "Resumen nuevo método",
        description: "Descripción para la ruta " + ruta + " -- method: " + metodo
    }

    if(asignarRequestBody) {
        agregarRequestBody(estructuraBasica, metodo);
    }

    agregarResponses(estructuraBasica);

    if(parametros.length) {
        estructuraBasica.parameters = parametros;
    }
 
    if(!docPaths[ruta]) {
        docPaths[ruta] = {
            [metodo]: estructuraBasica
        }
    }
 
    if(!docPaths[ruta][metodo]) {
       docPaths[ruta][metodo] = estructuraBasica;
    }

    
}

const actualizarDocumentacion = () => {
    fs.writeFileSync("./config/swagger.json", JSON.stringify(swaggerDoc, null, "\t"));
}

module.exports = {
    agregarRuta,
    actualizarDocumentacion
}