const express = require('express')
const cors = require('cors')
const db = require('./db/connection')

const app = express()
const PORT = process.env.PORT || 3003

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', servicio: 'menu' }))

// GET / — todos los productos disponibles
app.get('/', async (req, res) => {
  try {
    const { categoria } = req.query
    let query = 'SELECT * FROM productos WHERE disponible = true'
    const params = []
    if (categoria) {
      query += ' AND categoria = $1'
      params.push(categoria)
    }
    query += ' ORDER BY categoria, nombre'
    const result = await db.query(query, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener menu' })
  }
})

// GET /:id — detalle de producto
app.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM productos WHERE id=$1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto' })
  }
})

// POST / — crear producto (solo mostrador/admin)
app.post('/', async (req, res) => {
  const { nombre, descripcion, categoria, precio_base, imagen_url } = req.body
  try {
    const result = await db.query(
      `INSERT INTO productos (nombre, descripcion, categoria, precio_base, imagen_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, descripcion, categoria, precio_base, imagen_url]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al crear producto' })
  }
})

// PUT /:id — actualizar precio o disponibilidad
app.put('/:id', async (req, res) => {
  const { precio_base, disponible } = req.body
  try {
    const result = await db.query(
      'UPDATE productos SET precio_base=$1, disponible=$2 WHERE id=$3 RETURNING *',
      [precio_base, disponible, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto' })
  }
})

app.listen(PORT, () => console.log(`[Menu] corriendo en puerto ${PORT}`))
