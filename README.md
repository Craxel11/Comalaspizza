# Comalas Backend — Guía técnica para todos los equipos

## Estructura del proyecto

```
comalas-backend/
├── api-gateway/              ← Equipo microservicios
├── servicio-usuarios/        ← Equipo microservicios
├── servicio-pedidos/         ← Equipo microservicios
├── servicio-menu/            ← Equipo microservicios
├── servicio-notificaciones/  ← Equipo automatización (WhatsApp)
├── frontend/                 ← Copiar archivos HTML/CSS/JS aquí
├── docker-compose.yml        ← Levanta TODO con un comando
├── init-db.sql               ← Se ejecuta automáticamente al iniciar
└── .env.example              ← Copiar como .env y llenar valores
```

---

## Cómo levantar el proyecto completo

### Requisitos previos
- Docker Desktop instalado: https://www.docker.com/products/docker-desktop
- Git

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd comalas-backend

# 2. Crear el archivo de variables de entorno
cp .env.example .env
# Editar .env con los valores reales (ver sección Variables de entorno)

# 3. Levantar todos los servicios
docker compose up --build

# 4. Verificar que todo está corriendo
curl http://localhost:3000/health   # Gateway
curl http://localhost:3000/api/menu # Menú de productos
```

### Para bajar los servicios
```bash
docker compose down          # Baja contenedores (conserva datos)
docker compose down -v       # Baja contenedores Y borra la BD
```

---

## Puertos de cada servicio

| Servicio            | Puerto | URL local                          |
|---------------------|--------|------------------------------------|
| API Gateway         | 3000   | http://localhost:3000              |
| Servicio Usuarios   | 3001   | (solo accesible via gateway)       |
| Servicio Pedidos    | 3002   | (solo accesible via gateway)       |
| Servicio Menú       | 3003   | (solo accesible via gateway)       |
| Servicio Notif.     | 3004   | (solo accesible via gateway)       |
| PostgreSQL          | 5432   | localhost:5432                     |
| RabbitMQ Panel      | 15672  | http://localhost:15672             |

**Regla importante:** El frontend SIEMPRE habla con el puerto 3000 (gateway).
Nunca llama directamente a los puertos 3001-3004.

---

## Contrato de APIs — Endpoints disponibles

### Usuarios  →  /api/usuarios/...

| Método | Ruta                   | Body requerido                              | Respuesta           |
|--------|------------------------|---------------------------------------------|---------------------|
| POST   | /api/usuarios/registro | nombre, usuario, password, telefono         | { token, usuario }  |
| POST   | /api/usuarios/login    | usuario, password                           | { token, usuario }  |
| PUT    | /api/usuarios/perfil/:id | telefono, direccion, latitud, longitud    | { ok: true }        |

**Ejemplo registro:**
```bash
curl -X POST http://localhost:3000/api/usuarios/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","usuario":"9581234567","password":"mipass123","telefono":"9581234567"}'
```

**Ejemplo login:**
```bash
curl -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"9581234567","password":"mipass123"}'
```

---

### Menú  →  /api/menu/...

| Método | Ruta          | Query params    | Respuesta              |
|--------|---------------|-----------------|------------------------|
| GET    | /api/menu     | ?categoria=pizza | [ array de productos ] |
| GET    | /api/menu/:id | —               | { producto }           |
| POST   | /api/menu     | nombre, categoria, precio_base | { producto } |
| PUT    | /api/menu/:id | precio_base, disponible | { producto }   |

**Ejemplo — obtener solo pizzas:**
```bash
curl http://localhost:3000/api/menu?categoria=pizza
```

---

### Pedidos  →  /api/pedidos/...

| Método | Ruta                    | Descripción                        |
|--------|-------------------------|------------------------------------|
| GET    | /api/pedidos            | Lista todos (para el mostrador)    |
| GET    | /api/pedidos/:id        | Detalle de un pedido               |
| POST   | /api/pedidos            | Crear pedido nuevo                 |
| PUT    | /api/pedidos/:id/estado | Cambiar estado (mostrador)         |
| DELETE | /api/pedidos/:id        | Eliminar pedido                    |

**Ejemplo — crear pedido:**
```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "cliente_nombre": "Juan Lopez",
    "telefono": "9581234567",
    "direccion": "Calle Reforma 12, Puerto Escondido",
    "productos": [
      { "nombre": "Pizza Pepperoni (Grande)", "precio": 149, "cantidad": 1 },
      { "nombre": "Coca-Cola 600ml", "precio": 30, "cantidad": 2 }
    ]
  }'
```

**Ejemplo — cambiar estado (el mostrador lo usa):**
```bash
curl -X PUT http://localhost:3000/api/pedidos/1/estado \
  -H "Content-Type: application/json" \
  -d '{"estado": "En preparación"}'

# Estados válidos: "En preparación" | "En camino" | "Entregado"
```

Cuando el mostrador cambia el estado, automáticamente se publica
un evento en RabbitMQ y el cliente recibe un WhatsApp.

---

### Notificaciones  →  /api/notificaciones/...

| Método | Ruta                          | Descripción                      |
|--------|-------------------------------|----------------------------------|
| GET    | /api/notificaciones/health    | Verificar que el servicio corre  |
| POST   | /api/notificaciones/test-whatsapp | Probar envío manual         |

**Ejemplo — probar WhatsApp (equipo de automatización):**
```bash
curl -X POST http://localhost:3000/api/notificaciones/test-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"telefono":"9581234567","mensaje":"Hola, prueba desde Comalas"}'
```

---

## Variables de entorno — qué llena cada equipo

Editar el archivo `.env` antes de levantar:

```env
# ── Equipo microservicios llena esto ──────────────
DB_USER=comalas_user
DB_PASSWORD=password_seguro_aqui
MQ_USER=comalas_mq
MQ_PASSWORD=password_mq_aqui
JWT_SECRET=cadena_larga_aleatoria_aqui

# ── Equipo automatización llena esto ──────────────
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TOKEN=tu_token_aqui
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

## Qué hace cada equipo con este proyecto

### Equipo Microservicios (tu equipo)
- Mantener `docker-compose.yml`, `init-db.sql` y todos los servicios
- Asegurarse de que `docker compose up --build` funcione sin errores
- Exponer este repositorio a los demás equipos

### Equipo Despliegue (nube)
- Toman el `docker-compose.yml` y lo adaptan a ECS / GKE / etc.
- Configuran el registro de imágenes Docker (ECR, GCR, Docker Hub)
- Las variables de `.env` las pasan como secrets en la nube

### Equipo Seguridad
- Añaden middleware JWT en `api-gateway/src/index.js`
- El hook está preparado — buscar el comentario:
  `// El equipo de seguridad añadirá validación JWT aquí`
- También configuran HTTPS y rate limiting en el gateway o en el load balancer

### Equipo Automatización
- Configura la cuenta de Twilio y llena las variables TWILIO_* en `.env`
- El servicio de notificaciones ya está listo — solo necesita las credenciales
- Puede probar con: `POST /api/notificaciones/test-whatsapp`
- Panel de RabbitMQ disponible en: http://localhost:15672

---

## Cómo conectar el frontend a los microservicios

El frontend actualmente usa `localStorage` para todo. Hay que reemplazar
esas llamadas por `fetch` al API Gateway.

### Ejemplo — login
```javascript
// ANTES (localStorage)
localStorage.setItem('nombreCliente', nombre)

// AHORA (API real)
const res = await fetch('http://localhost:3000/api/usuarios/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ usuario, password })
})
const { token, usuario } = await res.json()
localStorage.setItem('token', token)
localStorage.setItem('nombreCliente', usuario.nombre)
```

### Ejemplo — realizar pedido
```javascript
// ANTES
localStorage.setItem('pedidosPizzaGo', JSON.stringify(pedidos))

// AHORA
const token = localStorage.getItem('token')
const res = await fetch('http://localhost:3000/api/pedidos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    usuario_id: localStorage.getItem('usuarioId'),
    cliente_nombre: localStorage.getItem('nombreCliente'),
    telefono: localStorage.getItem('telefonoCliente'),
    direccion: localStorage.getItem('direccion'),
    productos: carrito
  })
})
const pedido = await res.json()
```

### Ejemplo — obtener menú
```javascript
const res = await fetch('http://localhost:3000/api/menu')
const productos = await res.json()
// productos es un array de { id, nombre, categoria, precio_base, ... }
```

---

## Solución de problemas frecuentes

**"Cannot connect to PostgreSQL"**
```bash
# Verificar que postgres esté corriendo
docker compose ps
docker compose logs postgres
```

**"RabbitMQ connection refused"**
```bash
# RabbitMQ tarda ~10 segundos en iniciar. Los servicios tienen reintentos automáticos.
docker compose logs rabbitmq
```

**Reiniciar un servicio sin bajar todo**
```bash
docker compose restart servicio-pedidos
```

**Ver logs en tiempo real**
```bash
docker compose logs -f servicio-pedidos
docker compose logs -f servicio-notificaciones
```

**Reconstruir una imagen después de cambios en el código**
```bash
docker compose up --build servicio-pedidos
```

**Entrar a la base de datos directamente**
```bash
docker compose exec postgres psql -U comalas_user -d comalas
```
#   P i z z a s C o m a l a s  
 #   C o m a l a s p i z z a  
 