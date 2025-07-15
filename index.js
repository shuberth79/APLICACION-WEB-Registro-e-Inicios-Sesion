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


//9.3 ################################# M I D D L E W A R E S  (FIJO) #####################################
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); //LEER LOS DATOS DE FORMULARIOS: 2D False / 3D True
app.use(express.json()); //LEER LOS DATOS DESDE API
app.use("/", require("./src/router"));


//9.5 ############################## C A R P E T A   P U B L I C A  (FIJO) ################################
app.use("/resources", express.static(__dirname + "/public"));


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


