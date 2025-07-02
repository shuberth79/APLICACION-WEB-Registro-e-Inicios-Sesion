const db = require("../database/db");

exports.save = (req, res) => {
    const nombre = req.body.nombre;
    const precio = req.body.precio;
    const stock = req.body.stock;

    // console.log(nombre + " " + precio + " " + stock);

    db.query(
        "INSERT INTO productos SET ?", //INSERTAR DATOS
        {
            nombre: nombre,
            precio: precio,
            stock: stock,
        },
        (error, results) => { //CAPTAR ERRORES Y MOSTRARLOS
            if (error) {
                console.log(error);
                res.redirect("/admin");
            } else {  // EN CASO DE NO HABER ERRORES, ENTREGAR DATOS
                res.redirect("/admin");
            }
        }
    );
};



// ######################################## UPDATE ########################################
exports.update = (req, res) => {
    const ref = req.body.ref;
    const nombre = req.body.nombre;
    const precio = req.body.precio;
    const stock = req.body.stock;
    db.query(
        "UPDATE productos SET ? WHERE ref = ?", [{   
            nombre: nombre,  //NO INCLUIMOS LA REFERENCIA POR SER "ID" DEL PRODUCTO
            precio: precio,
            stock: stock,
        }
        , ref,
    ],
        (error, results) => { // BUSCA ERRROES O RESULTADOS
            if (error) {
                console.log(error); //CAPTAR ERRORES Y MOSTRARLOS
                res.redirect("/admin");
            } else {  // EN CASO DE NO HABER ERRORES, ENTREGAR DATOS
                res.redirect("/admin");
            }
        }
    );
};