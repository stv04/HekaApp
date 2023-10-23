const fs = require("fs");
const { agregarRuta } = require("./swaggerGen");

/**
 * La función `generadorDeRutas` configura rutas para un enrutador en función de un directorio
 * determinado y una configuración JSON.
 * @param directorio - El parámetro `directorio` representa la ruta del directorio donde se encuentran
 * las rutas.
 * @param router - El parámetro `router` es una instancia de Express Router. Se utiliza para definir y
 * manejar rutas en su aplicación.
 * @param jsonConfig - El parámetro `jsonConfig` es un objeto que contiene opciones de configuración
 * para configurar rutas. Tiene las siguientes propiedades:
 *  base: Para especificar la base del directorio para generar la documentación
 *  excepciones: Un arreglo de string en los que las normas del generador no aplicaría
 */
function generadorDeRutas(directorio, router, jsonConfig) {
    const {excepciones, base} = jsonConfig;

    // Esto para sacar la ruta base del directorio en caso de que no se le asigne
    const rutaBase = base || directorio.split("\\").pop();

    // Funcion para quitar el punto y así tener en concreto el nombre del archivo
    const nombreArchivo = arch => arch.split(".").shift().toLowerCase();

    // En caso de que no se configuren excepciones se toma el index.js por defecto
    const directoriosExcepcion = excepciones || ["index.js"];
    const directorios = fs.readdirSync(directorio);

    // La lista de directorios en lo que se va a configurar el enrutador
    directorios.filter(dir => !directoriosExcepcion.includes(dir))
    .forEach(dir => {
        // Nombre del directorio
        const name = dir;

        // Para leer todos los archivos disponibles en el directorio hijo
        const archivos = fs.readdirSync(directorio + "/" + name);

        // Para encontrar el archivo "router.js"
        const nRouter = archivos.find(arch => nombreArchivo(arch) === "router");
        
        // si no lo consigue, genera un error
        if(!nRouter) throw new Error("Falta añadir un \"router.js\" al directorio "+ name);

        // Toma el router sobre la carpeta encontrada para analizar sus hijos para generar documentación
        const routerNuevo = require(directorio + "/" + name + "/" + nRouter);

        // Agregando el generador de documentación de swagger
        routerNuevo.stack.forEach(s => {
            const path = s.route.path;
            const nombreRuta = `/${rutaBase}/${name}${path}`;
            const method = Object.keys(s.route.methods)[0];
            agregarRuta(nombreRuta, method, [name]);
        });

        // Finalmente se utiliza la ruta indicada, importando el router hijo
        router.use("/"+name, routerNuevo);
    });
}

module.exports = {
    generadorDeRutas
}