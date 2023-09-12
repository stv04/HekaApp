
# Heka App

La aplicación de heka, es un proyecto que plantea escalabilidad en el proceso de generación de api, permitiendo así generar de forma semi-automática documentación de lo que se está haciendo, y también validaciones concreatas para la relación cliente-servidor

## Características

- Genera Documentación con [Swagger](https://swagger.io)
- Tiene una estructura base predefinida
- Permite validar los métodos con [Zod](https://zod.dev)
- Aplicación escalable


## Forma de uso
Para comenzar el uso del aplicativo se debe intalar todas sus dependencias con el comando  `npm install`.

| Carpeta | Resultado Api |
| ------ | ------ |
| Api | /Api|
| - Router | /Api/Router |
| -- Router.js| /Api/Router|
| --- {method} | /Api/Router/method|

Con tan solo crear una carpeta dentro de la carpeta api, es necesario crear un archivo `Router.js` que lleva la estructura básica dada por express, una vez teniendo este esquema básico al iniciar con `npm start` automáticamente se genera la nueva documentación por medio de swagger, y solo queda datallarla en `config/swagger.io`.



## Estructura del proyecto
|Carpeta | Explicación|
|------|-------|
|Api| Donde se encontrarán todos las rutas precedidas por /Api|
|config|Donde se almacenan las contantes, keys y configuraciones del proyecto|
|Network|Conectividad de la infraestructura|
|procesos| Generador de procesos alternos|
|Schemas| Los esquemas que se utilizarán con Zod|
|storage|Base de datos|
|Utils|Funcionaes que pueden ser de utilidad en todo el proyecto|