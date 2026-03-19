const express = require('express')
const amqp = require('amqplib')
const twilio = require('twilio')

const app = express()
const PORT = process.env.PORT || 3004

app.use(express.json())

// ─── Cliente Twilio ───────────────────────────────────────────────────────────
// El equipo de automatización configura estas variables en .env
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
)
const FROM_WHATSAPP = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

// ─── Mensajes por estado ──────────────────────────────────────────────────────
const mensajePorEstado = {
  'Nuevo': (nombre, id) =>
    `Hola ${nombre}, tu pedido #${id} fue recibido. Tiempo estimado: 30-35 minutos. Gracias por elegir Comalas!`,
  'En preparación': (nombre, id) =>
    `Tu pedido #${id} esta siendo preparado con mucho sabor. Pronto estara listo!`,
  'En camino': (nombre, id) =>
    `Tu pedido #${id} ya salio y esta en camino a tu direccion. Prepara el apetito!`,
  'Entregado': (nombre, id) =>
    `Tu pedido #${id} fue entregado. Buen provecho! Que vuelvas pronto.`
}

// ─── Enviar WhatsApp ──────────────────────────────────────────────────────────
async function enviarWhatsApp (telefono, mensaje) {
  // Normalizar número: asegurar formato internacional
  let numero = telefono.replace(/\D/g, '')
  if (numero.length === 10) numero = '52' + numero  // asumir México si es local
  const destino = `whatsapp:+${numero}`

  try {
    const msg = await twilioClient.messages.create({
      from: FROM_WHATSAPP,
      to: destino,
      body: mensaje
    })
    console.log(`[Notif] WhatsApp enviado a ${destino} — SID: ${msg.sid}`)
    return true
  } catch (err) {
    console.error(`[Notif] Error enviando WhatsApp a ${destino}:`, err.message)
    return false
  }
}

// ─── Consumidor de RabbitMQ ───────────────────────────────────────────────────
async function iniciarConsumidor () {
  const url = `amqp://${process.env.MQ_USER}:${process.env.MQ_PASSWORD}@${process.env.MQ_HOST || 'rabbitmq'}`

  try {
    const conexion = await amqp.connect(url)
    const canal = await conexion.createChannel()
    await canal.assertQueue('pedido_eventos', { durable: true })

    console.log('[Notif] Escuchando eventos en la cola pedido_eventos...')

    canal.consume('pedido_eventos', async (msg) => {
      if (!msg) return

      try {
        const evento = JSON.parse(msg.content.toString())
        const { tipo, datos } = evento
        console.log(`[Notif] Evento recibido: ${tipo}`)

        if (tipo === 'pedido_creado' || tipo === 'estado_cambiado') {
          const { telefono, cliente_nombre, pedido_id, estado } = datos
          const generarMensaje = mensajePorEstado[estado]

          if (generarMensaje && telefono) {
            const texto = generarMensaje(cliente_nombre, pedido_id)
            await enviarWhatsApp(telefono, texto)
          }
        }

        canal.ack(msg)
      } catch (err) {
        console.error('[Notif] Error procesando evento:', err.message)
        canal.nack(msg, false, false)
      }
    })
  } catch (err) {
    console.error('[Notif] No se pudo conectar a RabbitMQ, reintentando en 5s...')
    setTimeout(iniciarConsumidor, 5000)
  }
}

iniciarConsumidor()

// ─── Endpoint de health y prueba manual ──────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', servicio: 'notificaciones' }))

// POST /test-whatsapp — para que el equipo de automatización pruebe
// Body: { telefono, mensaje }
app.post('/test-whatsapp', async (req, res) => {
  const { telefono, mensaje } = req.body
  const ok = await enviarWhatsApp(telefono, mensaje || 'Mensaje de prueba desde Comalas')
  res.json({ ok, telefono })
})

app.listen(PORT, () => console.log(`[Notificaciones] corriendo en puerto ${PORT}`))
