const express = require('express')
const cors = require('cors')
const pedidosRoutes = require('./routes/pedidos')

const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'pedidos' })
})

app.use('/', pedidosRoutes)

app.listen(PORT, () => {
  console.log(`[Pedidos] corriendo en puerto ${PORT}`)
})
