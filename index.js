//9 ###################################### L I B R E R I A S   (FIJO) ######################################
const express = require("express");
const app = express();
require("dotenv").config({ path: "./env/.env" });
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIO = require("socket.io");
const server = http.createServer(app);
const io = socketIO(server);
const db = require("./database/db");
const jwt = require("jsonwebtoken")
const setupSocket = require("./src/sockets/socketHandler");
const security = require("./src/middlewares/security");
const i18n = require('i18n');
const path = require('path');
const setGlobals = require('./src/middlewares/setGlobals');


//################################# Configurar lógica internacionalización
i18n.configure({
    locales: ['en', 'es'], // Idiomas disponibles
    directory: path.join(__dirname, 'locales'), // Carpeta donde se guardan los archivos de traducción
    defaultLocale: 'es',
    cookie: 'lang', // Puedes leer el idioma desde una cookie
    queryParameter: 'lang', // O desde la URL ?lang=en
    autoReload: true,
    syncFiles: true
});



//9.3 ################################# M I D D L E W A R E S  (FIJO) #####################################
app.use("/resources", express.static(__dirname + "/public"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); //LEER LOS DATOS DE FORMULARIOS: 2D False / 3D True
app.use(express.json()); //LEER LOS DATOS DESDE API
app.use(security);
app.use(i18n.init); 
app.use(setGlobals); //Siempre va penultimo en el codigo
app.use("/", require("./src/router"));

//9.5 ############################## C A R P E T A   P U B L I C A  (FIJO) ################################



//9.6 ######################################## V I S T A S  (FIJO) ########################################
app.set("view engine", "ejs");
// app.use(expressLayouts);
// app.set("views", __dirname + "/views"); //definimos la carpeta (no es necesario si la carpeta se llama views)


//9 7 ######################################## CARGAR SOCKETS
setupSocket(io);


//9.2 ######################################## S E R V I D O R ########################################
server.listen(4000, () => {
    console.log("El servidor está ejecutándose en http://localhost:4000");
});


