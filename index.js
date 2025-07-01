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

//5. Levantar la API (Dejarla activa)
app.listen(puerto, () => {
    console.log(`API escuchando en puerto ${puerto}`);
})