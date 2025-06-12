//9 ###################################### L I B R E R I A S   (FIJO) ###################################### 
const express = require ("express");
const app = express();
require("dotenv").config({path:'./env/.env'});
const bcrypt = require ("bcryptjs");
const session = require ("express-session");
const db = require("./database/db");
const { body, validationResult } = require("express-validator");


// 9.7 ######################################## S E S I O N  (FIJO) ######################################## 
app.use(
    session({
        secret: "secret", //"secret" es modificable, clave secreta para cifrar la cookie
        resave: false, //guardar la sesión en cada solicitud
        saveUninitialized: false, //guarda en cada peticion cuando se produzcan cambios
    })
);


//9.3 ######################################## M I D D L E W A R E S  (FIJO) ######################################## 
app.use(express.urlencoded({ extended: true })); //LEER LOS DATOS DE FORMULARIOS: 2D False / 3D True
app.use(express.json()); //LEER LOS DATOS DESDE API



//9.5 ######################################## C A R P E T A   P U B L I C A  (FIJO) ######################################## 
app.use('/resources', express.static(__dirname + '/public'));



//9.6 ######################################## V I S T A S  (FIJO) ######################################## 
app.set("view engine", "ejs");
// app.set("views", __dirname + "/views"); //definimos la carpeta (no es necesario si la carpeta se llama views)



//9.4 ######################################## R U T A S ######################################## 
// REDIRIGEN A LAS VISTAS
app.get("/", (req, res) => {
    if (req.session.loggedin) {
        res.render("index", { user: req.session.name, login: true, titulo: "Home", });
    } else {
        res.render("index", { user: "Debe iniciar sesión", login: false, titulo: "Home", });
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/registro", (req, res) => {
    res.render("register");
});


// // 9.8 ######################################## R U T A S   P O S T ########################################
// // ENVIAN INFORMACION (FORMULARIOS)
// app.post("/register", async (req, res) => {
//     //Recoger los datos del formulario
//     const user = req.body.user;
//     const name = req.body.name;
//     const rol = req.body.rol;
//     const pass = req.body.pass;

//     //Cifrar la contraseña
//     const passwordHash = await bcrypt.hash(pass, 8);



// // ######################################## B B D D ######################################## 
// // REGISTRAN EN BASE DE DATOS
//     db.query(
//         "INSERT INTO usuarios SET ?",
//         {
//             usuario: user,
//             nombre: name,
//             rol: rol,
//             pass: passwordHash
//         },
//         async (error, results) => {
//             if (error) {
//                 console.log(error); //INFORMA CUALQUIER ERROR
//             } else {
//                 res.render("register", {  //REGISTRO EN BASE DE DATOS
//                     alert: true,
//                     alertTitle: "Registro",
//                     alertMessage: "¡Registro exitoso!",
//                     alertIcon: "success",
//                     showConfirmButton: false,
//                     timer: 2500,
//                     ruta: "",
//                 });
//             }
//         }
//     );
// });

// ################## CREAMOS UN NUEVA RUTA + ARRAY
app.post(
    "/register",
    [
        body("user")
            .exists()
            .isLength({ min: 4 })
            .withMessage("El usuario debe tener al menos 4 caracteres"),
        body("name")
            .isLength({ min: 4 })
            .withMessage("El nombre debe tener al menos 4 caracteres"),
        body("pass")
            .isLength({ min: 4 })
            .withMessage("La contraseña debe tener al menos 4 caracteres"),
        body("email").isEmail().withMessage("El email no es valido"),
        body("edad").isNumeric().withMessage("La edad debe ser un número"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // res.status(400).json({ errors: errors.array() });
            // console.log(errors);

            console.log(req.body);
            const valores = req.body; //se guardan los valores introducidos en el formulario
            const validacionErrores = errors.array(); //se guarda en un array todos los errores producidos
            res.render("register", {
                validaciones: validacionErrores,
                valores: valores,
            });
        } else {
            //Recoger los datos del formulario
            const user = req.body.user;
            const name = req.body.name;
            const rol = req.body.rol;
            const pass = req.body.pass;
            // const email = req.body.email; // Nuevo campo
            // const edad = req.body.edad;  // Nuevo campo

            //Cifrar la contraseña
            const passwordHash = await bcrypt.hash(pass, 8);

            //Guardar el usuario en la base de datos
            db.query(
                "INSERT INTO usuarios SET ?",
                {
                    usuario: user,
                    nombre: name,
                    rol: rol,
                    pass: passwordHash,
                    // email: email,
                    // edad: edad
                },
                (error, results) => {
                    if (error) {
                        console.log(error);
                    } else {
                        res.render("register", {
                            alert: true,
                            alertTitle: "Registro",
                            alertMessage:
                                "El usuario se ha registrado correctamente",
                            alertIcon: "success",
                            showConfirmButton: false,
                            timer: 2500,
                            ruta: "",
                        });
                    }
                }
            );
        }
    }
);

// ######################################## I N I C I O  -  S E S I O N ######################################## 
// 
app.post("/auth", async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;

    //COMPROBAMOS EL USUARIO Y CONTRASEÑA
    if (user && pass) {
        //REVISAMOS SI USUARIO / CONTRASEÑA CONSTA EN LA BBDD
        db.query(
            "SELECT * FROM usuarios WHERE usuario = ?",
            [user],
            async (error, results) => {
                //comprobamos si hemos obtenido resultados y si ha coincidido la contraseña en tal caso
                if (
                    results.length == 0 ||
                    !(await bcrypt.compare(pass, results[0].pass))
                ) {
                    // AVISAMOS QUE LAS CREDENCIALES NO COINCIDEN
                    res.send("login", {
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "Usuario y/o contraseña erróneo",
                        alertIcon: "error",
                        showConfirmButton: true,
                        timer: false,
                        ruta: "login",
                        login: false,
                    });
                } else {
                    //variables de sesión
                    req.session.loggedin = true;
                    req.session.name = results[0].nombre;
                    //Mensaje simple para avisar de que es correcta la autenticación
                    res.render('login', {
                        alert: true,
                        alertTitle: "Conexión exitosa",
                        alertMessage: "¡Inicio de sesión exitoso!",
                        alertIcon:'success',
                        showConfirmButton: false,
                        timer: 2500,
                        ruta: "",
                        login: true,
                    });
                } //MENSAJE: CREDENCIALES CORRECTAS
            }
        );
    } else {
        res.render('login', {
            alert: true,
            alertTitle: "Advertencia",
            alertMessage: "Ingrese el usuario y la contraseña",
            alertIcon:'warning',
            showConfirmButton: true,
            timer: false,
            ruta: 'login',
            login:false,
        });
    }
});


// ######################################## C I E R R E  -  S E S I O N ######################################## 
// CIERRE SESION Y RE-DIRIGE A PAGINA PRINCIPAL
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    })
});

//9.2 ######################################## S E R V I D O R ######################################## 
app.listen(4000, () => {  //
    console.log("El servidor está ejecutándose en http://localhost:4000");
});
