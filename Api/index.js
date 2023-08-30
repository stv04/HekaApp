const express = require("express");
const fs = require("fs");
const { agregarRuta } = require("../Utils/swaggerGen");

const router = express.Router();

const nombreArchivo = arch => arch.split(".").shift().toLowerCase();
const directoriosExcepcion = ["index.js", "static"];
const directorios = fs.readdirSync(__dirname);

directorios.filter(dir => !directoriosExcepcion.includes(dir))
.forEach(dir => {
   const name = dir;
   const archivos = fs.readdirSync(__dirname + "/" + name);
   const nRouter = archivos.find(arch => nombreArchivo(arch) === "router");
   
   if(!nRouter) throw new Error("Falta añadir un \"router\" al directorio "+ name);

   const routers = require(__dirname + "/" + name + "/" + nRouter);

   // Agregando el generador de documentación de swagger
   routers.stack.forEach(s => {
      const path = s.route.path;
      const nombreRuta = `/Api/${name}${path}`;
      const method = Object.keys(s.route.methods)[0];
      agregarRuta(nombreRuta, method, [name]);
   });

   router.use("/"+name, routers);
});


module.exports = router;