const express = require('express'); //crea el servidor
const morgan = require('morgan'); //librería de peticiones - confirma comunicación con API
const cors = require('cors'); //permite la comunicacion entre servicios que corren por diferentes puertos
const { Sequelize, DataTypes } = require('sequelize');

//inicializamos nuestro servicio
const app = express();
const port = 3000;

//middlewares => funsiones que se ejecutan entre petición y respuesta que vamos a dar
app.use(cors());
app.use(morgan());
app.use(express.json()) //peticiones y respuestas devuelve en formato json

//############## CONEXION CON LA BASE DE DATOS por nombre de base de datos, usuario y contraseña#########################//
const sequelize = new Sequelize(
    'backend',
    'root',
    '', {
    host: 'localhost',
    dialect: 'mysql'
});

// conectar a base de datos
(async () => { 
    try { // intentar ejecutar lo que esta dentro del bloque y si da error salta al catch
        await sequelize.authenticate(); //await genera una llamada asincrona, que permite que el resto del codigo se siga ejecutando
        console.log('Conexion a la base de datos establecida correctamente.');
    } catch (error) {
        console.log('Error al conectar a la base de datos: ', error);
    }
})();

//definimos un objeto llamado productos que tiene que tener la estructura del la tabla de la base de datos
const Product = sequelize.define('producto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING, 
        allowNull: false 
    },
    precio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    categoria: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'producto', //objeto que cree se relaciona con la tabla usuario
    timestamps: false
});

//Sincronizamos a la base de Datos
(async () => {
    try {
        await sequelize.sync();
        console.log("Modelo sincronizar con la Base de Datos");
    } catch (error) {
        console.log('Error al sincronizar con la base de Datos: ', error);
    }
});


// Enlistamos TODOS los productos actuales.
app.get('/producto', async (req, res) => {
    res.status(200).json({
        ok: true,
        datos: await Product.findAll()
    });
});

// Buscamos producto por atributo 
app.get('/producto/buscar', async (req, res) => {
    const { query } = req; 
    const { id } = query;

    const producto = await Product.findByPk(id);
    if (producto === null) {
        res.status(404).json({
            ok: false, 
            menssaje: "No se encontraron productos"
        });
    } else {
        res.status(200).json({
            ok: true, 
            datos: producto
        });
    }
})

// CREAR NUEVO PRODUCTO
app.post('/producto/crear', async (req, res) => {
    const { nombre, precio, cantidad, categoria } = req.body; //rec.body es la informacion que envia el usuario, es seria equivalente a mail=req.body.mail, nombre=req.body.nombre, apellido=re.body.apellido.
    console.log(req.body)
    try {
        const newProduct = await Product.create({nombre,precio,cantidad,categoria});
        res.status(201).json({
            ok: true, // indicamos que todo va bien
            msg: 'Usuario creado con éxito',
            datos: newProduct
        })
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: "Error al crear usuario:" + error
        })
    }
});

// EDITAR UN PRODUCTO
app.put("/producto/editar", async (req, res) => {
    const { query } = req; //desestructuracion equivalente a poner query=req.query lo que sigue al signo de preguntas, ej: id=1
    //console.log(query);
    const { id } = query; //desestructuracion equivalente a poner id=query.id
    //console.log(id)
    const producto = await Product.findByPk(id);
    const { nombre, precio, cantidad, categoria } = req.body; 
    if (producto === null) {
        res.status(404).json({
            ok: false, 
            mensaje: "No se encontraron productos"
        });
    } else {
        try {
            producto.nombre=nombre||producto.nombre
            producto.precio=precio||producto.precio
            producto.cantidad=cantidad||producto.cantidad
            producto.categoria=categoria||producto.categoria
            await producto.save() //guardar la modificacion
            res.status(201).json({
                ok: true, // indicamos que todo va bien
                mensaje: 'Producto modificado con éxito',
                datos: producto
            })
        } catch (error) {
            res.status(500).json({
                ok: false,
                error: "Error al modificar producto:" + error
            })
        }
    }

});

//BORRAR PRODUCTO

app.delete('/producto/borrar', async (req, res) => {
    const { query } = req; //desestructuracion equivalente a poner query=req.query lo que sigue al signo de preguntas, ej: id=1
    //console.log(query);
    const { id } = query; //desestructuracion equivalente a poner id=query.id
    //console.log(id)

    const producto = await Product.findByPk(id);
    if (producto === null) {
        res.status(404).json({
            ok: false, 
            menssaje: "No se encontraron productos"
        });
    } else {
        try{
            await producto.destroy()
            res.status(200).json({
                ok: true, 
                mensaje: "Producto borrado"
            });
        }
        catch(error){
            res.status(500).json({
                ok: false, 
                mensaje: "No se pudo borrar. error: ", error
            });
        }
    }
})


// Endpoint GET /productos/top para obtener los n primeros productos ordenados
app.get('/producto/top', (req, res) => {
    const { n, criterio } = req.query;

    // Validar los parámetros de consulta
    if (!n || !criterio || isNaN(parseInt(n)) || (criterio !== 'precioAsc' && criterio !== 'precioDesc')) {
        return res.status(400).json({ error: "Parámetros de consulta inválidos" });
    }

    // Ordenar productos según el criterio especificado
    let productosOrdenados = [];
    if (criterio === 'precioAsc') {
        productosOrdenados = Product.sort((a, b) => a.precio - b.precio);
    } else if (criterio === 'precioDesc') {
        productosOrdenados = Product.sort((a, b) => b.precio - a.precio);
    }

    // Tomar los n primeros productos
    const productosTop = productosOrdenados.slice(0, parseInt(n));

    // Devolver los productos top como respuesta
    res.json(productosTop);
});

// Endpoint GET /productos/promedio para calcular el precio promedio
app.get('/productos/promedio', (req, res) => {
    let productosFiltrados = Product;

    // Filtrar productos por categoría si se proporciona el parámetro "categoria" en la consulta
    if (req.query.categoria) {
        productosFiltrados = Product.filter(producto => producto.categorias.includes(req.query.categoria));
    }

    // Calcular el precio promedio
    const totalProductos = productosFiltrados.length;
    if (totalProductos === 0) {
        return res.status(404).json({ error: "No se encontraron productos en la categoría especificada" });
    }

    const totalPrecio = productosFiltrados.reduce((total, producto) => total + producto.precio, 0);
    const precioPromedio = totalPrecio / totalProductos;

    // Devolver el precio promedio como respuesta
    res.json({ precioPromedio });
});


// Escuhamos en el puerto del express 3000
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
