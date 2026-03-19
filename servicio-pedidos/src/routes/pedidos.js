const express = require('express')
const amqp = require('amqplib')
const db = require('../db/connection')

const router = express.Router()

// ─── Conexión a RabbitMQ con reintentos ──────────────────────────────────────
let canal = null

async function conectarBroker () {
  const url = `amqp://${process.env.MQ_USER}:${process.env.MQ_PASSWORD}@${process.env.MQ_HOST || 'rabbitmq'}`
  try {
    const conexion = await amqp.connect(url)
    canal = await conexion.createChannel()
    await canal.assertQueue('pedido_eventos', { durable: true })
    console.log('[Pedidos] Conectado a RabbitMQ')
  } catch (err) {
    console.error('[Pedidos] RabbitMQ no disponible, reintentando en 5s...')
    setTimeout(conectarBroker, 5000)
  }
}
conectarBroker()

// ─── Publicar evento al broker ───────────────────────────────────────────────
function publicarEvento (tipo, datos) {
  if (!canal) return
  const msg = JSON.stringify({ tipo, datos, fecha: new Date() })
  canal.sendToQueue('pedido_eventos', Buffer.from(msg), { persistent: true })
  console.log(`[Pedidos] Evento publicado: ${tipo}`)
}

// ─── GET / — listar todos los pedidos (para el mostrador) ───────────────────
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, 
        json_agg(json_build_object('nombre', pi.nombre, 'precio', pi.precio, 'cantidad', pi.cantidad)) AS productos
       FROM pedidos p
       LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
       GROUP BY p.id
       ORDER BY p.fecha_creado DESC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error('[Pedidos] Error al listar:', err.message)
    res.status(500).json({ error: 'Error al obtener pedidos' })
  }
})

// ─── GET /:id — detalle de un pedido ────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*,
        json_agg(json_build_object('nombre', pi.nombre, 'precio', pi.precio, 'cantidad', pi.cantidad)) AS productos
       FROM pedidos p
       LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedido' })
  }
})

// ─── POST / — crear nuevo pedido ────────────────────────────────────────────
// Body: { usuario_id, cliente_nombre, telefono, direccion, latitud, longitud, productos: [{nombre, precio, cantidad}] }
router.post('/', async (req, res) => {
  const { usuario_id, cliente_nombre, telefono, direccion, latitud, longitud, productos } = req.body

  if (!productos || productos.length === 0) {
    return res.status(400).json({ error: 'El pedido debe tener al menos un producto' })
  }

  try {
    const subtotal = productos.reduce((sum, p) => sum + (p.precio * (p.cantidad || 1)), 0)

    const pedidoResult = await db.query(
      `INSERT INTO pedidos (usuario_id, cliente_nombre, telefono, direccion, latitud, longitud, subtotal, total, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, 'Nuevo')
       RETURNING *`,
      [usuario_id, cliente_nombre, telefono, direccion, latitud, longitud, subtotal]
    )
    const pedido = pedidoResult.rows[0]

    // Insertar items
    for (const p of productos) {
      await db.query(
        'INSERT INTO pedido_items (pedido_id, nombre, precio, cantidad) VALUES ($1, $2, $3, $4)',
        [pedido.id, p.nombre, p.precio, p.cantidad || 1]
      )
    }

    // Publicar evento para notificaciones
    publicarEvento('pedido_creado', {
      pedido_id: pedido.id,
      telefono,
      cliente_nombre,
      total: subtotal,
      estado: 'Nuevo'
    })

    res.status(201).json({ ...pedido, productos })
  } catch (err) {
    console.error('[Pedidos] Error al crear:', err.message)
    res.status(500).json({ error: 'Error al crear pedido' })
  }
})

// ─── PUT /:id/estado — cambiar estado (el mostrador lo usa) ─────────────────
// Body: { estado } — valores: "En preparación" | "En camino" | "Entregado"
router.put('/:id/estado', async (req, res) => {
  const { estado } = req.body
  const estadosValidos = ['En preparación', 'En camino', 'Entregado']

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado debe ser uno de: ${estadosValidos.join(', ')}` })
  }

  try {
    const result = await db.query(
      `UPDATE pedidos SET estado=$1, fecha_actualizado=NOW()
       WHERE id=$2 RETURNING *`,
      [estado, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' })

    const pedido = result.rows[0]

    // Publicar evento — el servicio de notificaciones lo escucha
    publicarEvento('estado_cambiado', {
      pedido_id: pedido.id,
      telefono: pedido.telefono,
      cliente_nombre: pedido.cliente_nombre,
      estado: pedido.estado
    })

    res.json(pedido)
  } catch (err) {
    console.error('[Pedidos] Error al actualizar estado:', err.message)
    res.status(500).json({ error: 'Error al actualizar estado' })
  }
})

// ─── DELETE /:id — eliminar pedido ──────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM pedidos WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar pedido' })
  }
})

module.exports = router
