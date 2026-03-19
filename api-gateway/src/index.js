const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// ─── Health check del gateway ────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'api-gateway', hora: new Date() })
})

// ─── Rutas públicas (sin JWT) ────────────────
// El equipo de seguridad añadirá validación JWT aquí
// Por ahora el gateway solo enruta

app.use('/api/usuarios', createProxyMiddleware({
  target: process.env.URL_USUARIOS,
  changeOrigin: true,
  pathRewrite: { '^/api/usuarios': '' },
  on: {
    error: (err, req, res) => {
      res.status(503).json({ error: 'Servicio de usuarios no disponible' })
    }
  }
}))

app.use('/api/pedidos', createProxyMiddleware({
  target: process.env.URL_PEDIDOS,
  changeOrigin: true,
  pathRewrite: { '^/api/pedidos': '' },
  on: {
    error: (err, req, res) => {
      res.status(503).json({ error: 'Servicio de pedidos no disponible' })
    }
  }
}))

app.use('/api/menu', createProxyMiddleware({
  target: process.env.URL_MENU,
  changeOrigin: true,
  pathRewrite: { '^/api/menu': '' },
  on: {
    error: (err, req, res) => {
      res.status(503).json({ error: 'Servicio de menu no disponible' })
    }
  }
}))

app.use('/api/notificaciones', createProxyMiddleware({
  target: process.env.URL_NOTIFICACIONES,
  changeOrigin: true,
  pathRewrite: { '^/api/notificaciones': '' },
  on: {
    error: (err, req, res) => {
      res.status(503).json({ error: 'Servicio de notificaciones no disponible' })
    }
  }
}))

app.listen(PORT, () => {
  console.log(`[Gateway] corriendo en puerto ${PORT}`)
  console.log(`  → Usuarios:       ${process.env.URL_USUARIOS}`)
  console.log(`  → Pedidos:        ${process.env.URL_PEDIDOS}`)
  console.log(`  → Menu:           ${process.env.URL_MENU}`)
  console.log(`  → Notificaciones: ${process.env.URL_NOTIFICACIONES}`)
})
