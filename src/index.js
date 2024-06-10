//conexión a la base de datos
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('nombre_db', 'usuario', 'contraseña',{
    host: 'localhost',
    dialect: 'mysql'
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida correctamente.');
} catch (error) {
    console.error('Eroor al conectar a la base de datos:', error);
}
})();

//Definición de un modelo

const { Sequelize, DataTypes } = require('sequelize');

const User = sequelize.define('User',{
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull:false
    },
    age: {
        type: DataTypes.INTEGER
    }
});

// Sincronizar el modelo con la base de datos
(async () => {
    try {
        await sequelize.sync();
        console.log('Modelo sincronizado correctamente con la base de datos.');
    } catch (error) {
console.error('Error al sincronizar el modelo:', error);
    }
})();

//Consultas basicas, create
const newUser = await User.create({
    firstName: 'Melina',
    lastName: 'Ulloa',
    age: 25
});

//Obtener todos los registros

const users = awai User.findAll();
