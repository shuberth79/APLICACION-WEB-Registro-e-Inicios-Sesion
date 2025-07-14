//9 ###################################### L I B R E R I A S   (FIJO) ######################################
const express = require("express");
const router = express();
const bcrypt = require("bcryptjs");
const db = require("../database/db");
const { body, validationResult } = require("express-validator");
const crud = require ("../src/controllers")


// ######################################## F U N C I O N E S ########################################
function verificarSesion(req, res, next) {
    if (req.session.loggedin) {
        return next();
    }
    res.redirect('/login');
}

function verificarAdmin(req, res, next) {
    //operador de encadenamiento opcional ?. Si no existe no da error
    if (req.session?.loggedin && req.session?.rol === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Acceso denegado' });
}


//9.4 ######################################## R U T A S ########################################
router.get("/", (req, res) => {
    if (req.session.loggedin) {
        res.render("index", {
            user: req.session.name,
            login: true,
        });
    } else {
        res.render("index", {
            user: "Debe iniciar sesión",
            login: false,
        });
    }
});



// ######################################## RUTA A VISTA LOGIN
// router.get("/login", (req, res) => {
//     res.render("login");
// });


router.get("/login", (req, res) => {
    if (req.session.loggedin) {
        res.render("login", {
            login: true,
        });
    } else {
        res.render("login", {
            login: false,
        });
    }
});



// ######################################## RUTA A VISTA REGISTRO
// router.get("/registro", (req, res) => {
//     res.render("register");
// });

router.get("/registro", (req, res) => {
    if (req.session.loggedin) {
        res.render("register", {
            login: true,
        });
    } else {
        res.render("register", {
            login: false,
        });
    }
});



// ######################################## C I E R R E  -  S E S I O N ########################################
router.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
});


// ######################################## RUTA A VISTA ADMIN
// router.get("/admin", (req, res) => {
//     res.render("admin");
// });

router.get("/admin", verificarSesion, (req, res) => {
    if (req.session.loggedin) {
        db.query("SELECT * FROM productos", (error, results) => { //CONSULTAMOS Y CAPTURAMOS DATOS
            if (error) {
                throw error; // EN CASO DE HABER ERRORES MOSTRARNOS
            } else {
                res.render("admin", {  // EN CASO DE NO HABER ERRORES LLEVARNOS A VISTA ADMIN
                    productos: results,
                    login: true,
                    rol: req.session.rol,
                });
            }
        });
    } else {
        res.render("admin", {
            msg: "Acceso restringuido, inicie sesión",
            login: false,
        });
    }
});



// ######################################## RUTA A VISTA CREATE
// router.get("/create", (req, res) => {
//     res.render("create");
// });

router.get("/create", (req, res) => {
    if (req.session.loggedin) {
        res.render("create", {
            login: true,
        });
    } else {
        res.redirect("/")
    }
});


// ######################################## RUTA A VISTA EDIT
// router.get("/edit/:ref", (req, res) => {
//     const ref = req.params.ref;
//     db.query(
//         "SELECT * FROM productos WHERE ref = ?", [ref], (error, results) => { 
//             if (error) {
//                 throw error; 
//             } else {
//                 res.render("edit", {  
//                     producto: results[0],
//                 });
//             }
//         }
//     );
// })


router.get("/edit/:ref", (req, res) => {
    if (req.session.loggedin) {
        const ref = req.params.ref;
        db.query(
            "SELECT * FROM productos WHERE ref = ?", [ref], (error, results) => { 
                if (error) {
                    throw error; // EN CASO DE HABER ERRORES MOSTRARNOS
                } else {
                    res.render("edit", {  // EN CASO DE NO HABER ERRORES LLEVARNOS A VISTA ADMIN
                        producto: results[0],
                        login: true,
                    });
                }
            }  
        );
    } else {
        res.redirect("/");
    }
})



// ######################################## RUTA A VISTA DELETE
router.get("/delete/:ref", (req, res) => {
    const ref = req.params.ref;
    db.query(
        "DELETE FROM productos WHERE ref = ?", [ref], (error, results) => { 
            if (error) {
                throw error; 
            } else {
                res.redirect("/admin");
            }
        }
    );
})



// ######################################## RUTA A VISTA SOPORTE
router.get("/soporte", verificarSesion, (req, res) => {
    res.render("soporte", {
        user: {
            username: req.session.user || req.session.name,
            role: req.session.rol
        }
    });
});



// ######################################## API MENSAJES
router.get("/api/mensajes", verificarAdmin, (req, res) => {
    const usuario = req.query.con; // Extrae el usuario desde la url (...?con=usuarioX)

    if (!usuario) { //si no hay usuario que devuelva el error
        return res.status(400).json({ error: "Falta el parámetro ?con=usuario" });
    }

    const sql = `
    SELECT de_usuario, para_usuario, mensaje, fecha
    FROM mensajes
    WHERE 
      (de_usuario = ? OR para_usuario = ?)
    ORDER BY fecha ASC
    `;

    db.query(sql, [usuario, usuario], (err, results) => {
        if (err) {
            console.error("❌ Error al consultar mensajes:", err);
            return res.status(500).json({ error: "Error al obtener mensajes" });
        }

        // DEVUELVE LOS MENSAJES EN FORMATO JSON
        res.json(results);
    });
});



// ######################################## API MENSAJES MIOS
router.get("/api/mensajes/mios", (req, res) => {
    const usuario = req.session.user;

    if (!req.session?.loggedin || !usuario) { //VERIFICA QUE EL USUARIO ESTE LOGUEADO Y TENGA UN USUARIO
        return res.status(403).json({ error: "No autorizado" });
    }

    const sql = `
    SELECT de_usuario, para_usuario, mensaje, fecha
    FROM mensajes
    WHERE 
      (de_usuario = ? OR para_usuario = ?)
    ORDER BY fecha ASC
    `;

    db.query(sql, [usuario, usuario], (err, results) => {
        if (err) {
            console.error("❌ Error al obtener mensajes:", err);
            return res.status(500).json({ error: "Error interno" });
        }

        // DEVUELVE LOS MENSAJES EN FORMATO JSON
        res.json(results);
    });
});



// ######################################## API USUARIOS
router.get("/api/usuarios-conversaciones", verificarAdmin, (req, res) => {

    /*Busca mensajes donde participen administradores.
    usa UNION para combinar las dos consultas y elimina duplicados
    renombra las dos columnas como "usuario" para poder procesarlas
    filtra los que no son administradores y elimina los duplicados

    Devuelve un array de usuarios
    */
    const sql = `
    SELECT DISTINCT usuario
    FROM (
      SELECT de_usuario AS usuario FROM mensajes
      WHERE para_usuario IN (SELECT usuario FROM usuarios WHERE rol = 'admin')
      
      UNION
      
      SELECT para_usuario AS usuario FROM mensajes
      WHERE de_usuario IN (SELECT usuario FROM usuarios WHERE rol = 'admin')
    ) AS conversaciones
    WHERE usuario NOT IN (SELECT usuario FROM usuarios WHERE rol = 'admin')
  `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Error al obtener lista de usuarios:", err);
            return res.status(500).json({ error: "Error interno" });
        }

        const usuarios = results.map(r => r.usuario); // EXTRAE LOS NOMBRES DE LOS USUARIOS
        res.json(usuarios); //LOS DEVUELVE EN FORMATO JSON
    });
});






// #######################################################################################################
// ######################################## R U T A S - P O S T S ########################################
// #######################################################################################################

router.post(
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
                },
                (error, results) => {
                    if (error) {
                        console.log(error);
                    } else {
                        res.render("register", {
                            alert: true,
                            alertTitle: "Registro",
                            alertMessage: "El usuario se ha registrado correctamente",
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
router.post("/auth", async (req, res) => {
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
                    req.session.user = results[0].usuario;
                    req.session.rol = results[0].rol;
                    //Mensaje simple para avisar de que es correcta la autenticación
                    res.render("login", {
                        alert: true,
                        alertTitle: "Conexión exitosa",
                        alertMessage: "¡Inicio de sesión exitoso!",
                        alertIcon: "success",
                        showConfirmButton: false,
                        timer: 2500,
                        ruta: "",
                        login: true,
                    });
                }
            }
        );
    } else {
        res.render("login", {
            alert: true,
            alertTitle: "Advertencia",
            alertMessage: "Ingrese el usuario y la contraseña",
            alertIcon: "warning",
            showConfirmButton: true,
            timer: false,
            ruta: "login",
            login: false,
        });
    }
});


router.post("/save", crud.save);
router.post("/update", crud.update);


module.exports = router;