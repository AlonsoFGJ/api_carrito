//1. Importar libreria
const express = require('express')
const oracledb = require('oracledb')


//2. Vamos a crear la API:
const app = express()
const puerto = 8003
const dbConfig = {
    user: 'api_express',
    password: 'api_express',
    connectString: 'localhost:1521/xe'
}
const API_KEY = 'apikeysecreta123'

const cors = require('cors');
app.use(cors());

function validarApiKey(req, res, next){
    const apikeyEntregada = req.headers['x-api-key']
    if(!apikeyEntregada || apikeyEntregada!==API_KEY){
        res.status(401).json({error: "APIKEY no entregada o incorrecta"})
    }
    next()
}

//3. Middleware:
app.use(express.json())

//4. Endpoints:
app.get('/', (request, response) => {
    response.status(200).json( {mensaje: "Hola express"} )
})

app.get('/info_carritos', validarApiKey, async(req, res) => {
    let cone
    try {
        cone = await oracledb.getConnection(dbConfig)
        const result = await cone.execute("SELECT * FROM info_carrito")
        res.status(200).json(result.rows.map(row => ({
            id_carrito: row[0],
            rut_usuario: row[1],
            descripcion_carrito: row[2],
            precio_total: row[3]
        })))

    } catch (ex) {
        res.status(500).json( {error: ex.message} )
    } finally {
        if (cone) cone.close()
    }
})


// Obtener carrito por RUT
app.get('/info_carritos/:rut', validarApiKey, async (req, res) => {
    let cone;
    try {
        cone = await oracledb.getConnection(dbConfig);
        const rutUsuario = String(req.params.rut); // ✅ Cambiado a 'rut'

        const result = await cone.execute(
            `SELECT * FROM info_carrito WHERE rut_usuario = :rut_usuario`,
            { rut_usuario: {val: rutUsuario, type: oracledb.STRING} } // ✅ Usamos bind variables correctamente
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Carrito no encontrado" });
        }

        const row = result.rows[0];
        res.status(200).json({
            id_carrito: row[0],
            rut_usuario: row[1],
            descripcion_carrito: row[2],
            precio_total: row[3]
        });

    } catch (ex) {
        res.status(500).json({ error: ex.message });
    } finally {
        if (cone) await cone.close();
    }
});

// Crear un nuevo carrito
app.post('/info_carritos', validarApiKey, async (req, res) => {
    const { id_carrito, rut_usuario, descripcion_carrito, precio_total } = req.body
    let cone
    try {
        cone = await oracledb.getConnection(dbConfig)
        await cone.execute(
            `INSERT INTO info_carrito VALUES (:id, :rut, :descripcion, :precio)`,
            [id_carrito, rut_usuario, descripcion_carrito, precio_total],
            { autoCommit: true }
        )
        res.status(201).json({ mensaje: "Carrito creado con éxito" })
    } catch (ex) {
        res.status(500).json({ error: ex.message })
    } finally {
        if (cone) cone.close()
    }
})

// Actualizar completamente un carrito
app.put('/info_carritos/:id', validarApiKey, async (req, res) => {
    const { rut_usuario, descripcion_carrito, precio_total } = req.body
    let cone
    try {
        cone = await oracledb.getConnection(dbConfig)
        const result = await cone.execute(
            `UPDATE info_carrito 
             SET rut_usuario = :rut, descripcion_carrito = :descripcion, precio_total = :precio 
             WHERE id_carrito = :id`,
            [rut_usuario, descripcion_carrito, precio_total, req.params.id],
            { autoCommit: true }
        )
        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Carrito no encontrado" })
        }
        res.status(200).json({ mensaje: "Carrito actualizado con éxito" })
    } catch (ex) {
        res.status(500).json({ error: ex.message })
    } finally {
        if (cone) cone.close()
    }
})

// Eliminar un carrito
app.delete('/info_carritos/:id', validarApiKey, async (req, res) => {
    let cone
    try {
        cone = await oracledb.getConnection(dbConfig)
        const result = await cone.execute(
            `DELETE FROM info_carrito WHERE id_carrito = :id`,
            [req.params.id],
            { autoCommit: true }
        )
        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Carrito no encontrado" })
        }
        res.status(200).json({ mensaje: "Carrito eliminado con éxito" })
    } catch (ex) {
        res.status(500).json({ error: ex.message })
    } finally {
        if (cone) cone.close()
    }
})

// Actualización parcial de un carrito
app.patch('/info_carritos/:id', validarApiKey, async (req, res) => {
    const { rut_usuario, descripcion_carrito, precio_total } = req.body
    let campos = []
    let valores = {}

    if (rut_usuario) {
        campos.push("rut_usuario = :rut")
        valores.rut = rut_usuario
    }
    if (descripcion_carrito) {
        campos.push("descripcion_carrito = :descripcion")
        valores.descripcion = descripcion_carrito
    }
    if (precio_total !== undefined) {
        campos.push("precio_total = :precio")
        valores.precio = precio_total
    }

    if (campos.length === 0) {
        return res.status(400).json({ error: "Debe enviar al menos un campo para actualizar" })
    }

    valores.id = req.params.id

    let cone
    try {
        cone = await oracledb.getConnection(dbConfig)
        const result = await cone.execute(
            `UPDATE info_carrito SET ${campos.join(', ')} WHERE id_carrito = :id`,
            valores,
            { autoCommit: true }
        )
        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Carrito no encontrado" })
        }
        res.status(200).json({ mensaje: "Carrito actualizado parcialmente con éxito" })
    } catch (ex) {
        res.status(500).json({ error: ex.message })
    } finally {
        if (cone) cone.close()
    }
})


//5. Levantar la API (Dejarla activa)
app.listen(puerto, () => {
    console.log(`API escuchando en puerto ${puerto}`);
})