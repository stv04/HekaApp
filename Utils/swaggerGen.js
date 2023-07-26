const fs = require("fs");

const swaggerDoc = require("../config/swagger.json");

const {paths: docPaths} = swaggerDoc;

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

exports.agregarRuta = (rutaOriginal, metodo, tags) => {
    const {ruta, parametros} = transformarParametroSwagger(rutaOriginal);
    const estructuraBasica = {
       tags: tags,
       summary: "Resumen nuevo método",
       description: "Descripción para la ruta " + ruta + " -- method: " + metodo,
       responses: {
          200: {
             description: "mis respuestas por defecto"
          }
       }
    }

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

exports.actualizarDocumentacion = () => {
    fs.writeFileSync("./config/swagger.json", JSON.stringify(swaggerDoc, null, "\t"));
}