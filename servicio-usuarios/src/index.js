const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'usuarios' })
})

app.use('/', authRoutes)

app.listen(PORT, () => {
  console.log(`[Usuarios] corriendo en puerto ${PORT}`)
})
