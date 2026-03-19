const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db/connection')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

// ─── POST /registro ──────────────────────────────────────────────────────────
// Body: { nombre, usuario, password, telefono }
router.post('/registro', async (req, res) => {
  try {
    const { nombre, usuario, password, telefono } = req.body

    if (!nombre || !usuario || !password) {
      return res.status(400).json({ error: 'Nombre, usuario y password son requeridos' })
    }

    // Verificar si ya existe
    const existe = await db.query(
      'SELECT id FROM usuarios WHERE usuario = $1',
      [usuario]
    )
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'El usuario ya existe' })
    }

    const hash = await bcrypt.hash(password, 12)
    const result = await db.query(
      `INSERT INTO usuarios (nombre, usuario, password, telefono)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, usuario, telefono, rol`,
      [nombre, usuario, hash, telefono || usuario]
    )

    const nuevoUsuario = result.rows[0]
    const token = jwt.sign(
      { id: nuevoUsuario.id, rol: nuevoUsuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ token, usuario: nuevoUsuario })
  } catch (err) {
    console.error('[Usuarios] Error en registro:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── POST /login ─────────────────────────────────────────────────────────────
// Body: { usuario, password }
router.post('/login', async (req, res) => {
  try {
    const { usuario, password } = req.body

    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y password requeridos' })
    }

    const result = await db.query(
      'SELECT * FROM usuarios WHERE usuario = $1',
      [usuario]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const user = result.rows[0]
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        telefono: user.telefono,
        rol: user.rol
      }
    })
  } catch (err) {
    console.error('[Usuarios] Error en login:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── PUT /perfil/:id — actualiza direccion y telefono ────────────────────────
router.put('/perfil/:id', async (req, res) => {
  try {
    const { telefono, direccion, latitud, longitud } = req.body
    await db.query(
      `UPDATE usuarios SET telefono=$1, direccion=$2, latitud=$3, longitud=$4
       WHERE id=$5`,
      [telefono, direccion, latitud, longitud, req.params.id]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando perfil' })
  }
})

module.exports = router
