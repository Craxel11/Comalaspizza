let carrito = []
let subtotal = 0

let configuracionPizza = {
  tamano: null,
  precioBase: 0,
  maxIngredientes: 0,
  precioOrilla: 0,
  ingredientes: [],
  orilla: "No"
}

function estaEnHorario() {
  const h = new Date().getHours()
  return h >= 16 && h < 23
}

function mostrarSeccion(id, boton = null) {
  // Mostrar u ocultar aviso de horario al entrar al carrito
  if (id === "carrito") {
    const mensajeHorario = document.getElementById("mensajeHorario")
    if (mensajeHorario) mensajeHorario.style.display = estaEnHorario() ? "none" : "flex"
  }

  // Ocultar nav-tabs en bienvenida, mostrar en las demás secciones
  const navTabs = document.querySelector(".nav-tabs")
  if (navTabs) navTabs.style.display = id === "bienvenida" ? "none" : "flex"
  document.querySelectorAll(".seccion").forEach(sec => {
    sec.classList.remove("activa")
  })

  const seccionActiva = document.getElementById(id)
  if (seccionActiva) {
    seccionActiva.classList.add("activa")
  }

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("active-tab")
  })

  if (boton) {
    boton.classList.add("active-tab")
  } else {
    const botonRelacionado = document.querySelector(`[data-seccion="${id}"]`)
    if (botonRelacionado) {
      botonRelacionado.classList.add("active-tab")
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" })
}

function iniciarConstructorPizza() {
  const radiosTamano = document.querySelectorAll('input[name="tamanoPizza"]')
  const checksIngredientes = document.querySelectorAll('input[name="ingredientePizza"]')
  const radiosOrilla = document.querySelectorAll('input[name="orillaRellena"]')

  radiosTamano.forEach(radio => {
    radio.addEventListener("change", () => { configurarTamanoPizza(radio) })
  })

  checksIngredientes.forEach(check => {
    check.addEventListener("change", () => { controlarIngredientes() })
  })

  radiosOrilla.forEach(radio => {
    radio.addEventListener("change", () => {
      configuracionPizza.orilla = radio.value
      actualizarResumenPizza()
    })
  })
}

function configurarTamanoPizza(radioSeleccionado) {
  configuracionPizza.tamano = radioSeleccionado.value
  configuracionPizza.precioBase = Number(radioSeleccionado.dataset.precio)
  configuracionPizza.maxIngredientes = Number(radioSeleccionado.dataset.maxIngredientes)
  configuracionPizza.precioOrilla = Number(radioSeleccionado.dataset.orilla)

  const ingredientesInfo = document.getElementById("ingredientesInfo")
  const orillaInfo = document.getElementById("orillaInfo")
  const orillaPrecioVisual = document.getElementById("orillaPrecioVisual")

  if (ingredientesInfo) {
    ingredientesInfo.textContent =
      `Puedes seleccionar hasta ${configuracionPizza.maxIngredientes} ingrediente(s) para una pizza ${configuracionPizza.tamano.toLowerCase()}.`
  }
  if (orillaInfo) {
    orillaInfo.textContent =
      `Orilla rellena para ${configuracionPizza.tamano.toLowerCase()}: +$${configuracionPizza.precioOrilla}`
  }
  if (orillaPrecioVisual) {
    orillaPrecioVisual.textContent = `$${configuracionPizza.precioOrilla}`
  }

  limpiarIngredientesSiEsNecesario()
  actualizarResumenPizza()
}

function limpiarIngredientesSiEsNecesario() {
  const checksIngredientes = document.querySelectorAll('input[name="ingredientePizza"]:checked')
  if (checksIngredientes.length > configuracionPizza.maxIngredientes) {
    checksIngredientes.forEach(check => { check.checked = false })
    configuracionPizza.ingredientes = []
    mostrarMensajePizzaBuilder("Se reiniciaron los ingredientes porque cambiaste el tamaño.")
  }
}

function controlarIngredientes() {
  const checksSeleccionados = [...document.querySelectorAll('input[name="ingredientePizza"]:checked')]

  if (!configuracionPizza.tamano) {
    checksSeleccionados.forEach(check => { check.checked = false })
    mostrarMensajePizzaBuilder("Primero debes seleccionar un tamaño.")
    return
  }

  if (checksSeleccionados.length > configuracionPizza.maxIngredientes) {
    const ultimo = checksSeleccionados[checksSeleccionados.length - 1]
    ultimo.checked = false
    mostrarMensajePizzaBuilder(`Solo puedes seleccionar hasta ${configuracionPizza.maxIngredientes} ingrediente(s) para una pizza ${configuracionPizza.tamano.toLowerCase()}.`)
  }

  configuracionPizza.ingredientes = [...document.querySelectorAll('input[name="ingredientePizza"]:checked')].map(check => check.value)
  actualizarResumenPizza()
}

function actualizarResumenPizza() {
  const resumenTamano = document.getElementById("resumenTamanoPizza")
  const resumenIngredientes = document.getElementById("resumenIngredientesPizza")
  const resumenOrilla = document.getElementById("resumenOrillaPizza")
  const resumenPrecioBase = document.getElementById("resumenPrecioBasePizza")
  const resumenExtraOrilla = document.getElementById("resumenExtraOrillaPizza")
  const resumenTotal = document.getElementById("resumenTotalPizza")

  const extraOrilla = configuracionPizza.orilla === "Si" ? configuracionPizza.precioOrilla : 0
  const totalPizza = configuracionPizza.precioBase + extraOrilla

  if (resumenTamano) resumenTamano.textContent = configuracionPizza.tamano || "No seleccionado"
  if (resumenIngredientes) resumenIngredientes.textContent = configuracionPizza.ingredientes.length > 0 ? configuracionPizza.ingredientes.join(", ") : "No seleccionados"
  if (resumenOrilla) resumenOrilla.textContent = configuracionPizza.orilla === "Si" ? `Sí (+$${configuracionPizza.precioOrilla})` : "No"
  if (resumenPrecioBase) resumenPrecioBase.textContent = configuracionPizza.precioBase || 0
  if (resumenExtraOrilla) resumenExtraOrilla.textContent = extraOrilla
  if (resumenTotal) resumenTotal.textContent = totalPizza
}

function agregarPizzaPersonalizada() {
  if (!configuracionPizza.tamano) { mostrarMensajePizzaBuilder("Selecciona un tamaño de pizza."); return }
  if (configuracionPizza.ingredientes.length === 0) { mostrarMensajePizzaBuilder("Selecciona al menos un ingrediente."); return }
  if (configuracionPizza.ingredientes.length > configuracionPizza.maxIngredientes) {
    mostrarMensajePizzaBuilder(`Has seleccionado demasiados ingredientes para una pizza ${configuracionPizza.tamano.toLowerCase()}.`)
    return
  }

  const extraOrilla = configuracionPizza.orilla === "Si" ? configuracionPizza.precioOrilla : 0
  const totalPizza = configuracionPizza.precioBase + extraOrilla
  const nombrePizza = `Pizza ${configuracionPizza.tamano} - ${configuracionPizza.ingredientes.join(" + ")}${configuracionPizza.orilla === "Si" ? " con orilla rellena" : ""}`

  carrito.push({ nombre: nombrePizza, precio: totalPizza })
  subtotal += totalPizza
  actualizarCarrito()
  mostrarToast("Pizza personalizada agregada al carrito")
  mostrarMensajePizzaBuilder("Pizza agregada correctamente")
  reiniciarConstructorPizza()
}

function reiniciarConstructorPizza() {
  document.querySelectorAll('input[name="tamanoPizza"]').forEach(r => { r.checked = false })
  document.querySelectorAll('input[name="ingredientePizza"]').forEach(c => { c.checked = false })
  document.querySelectorAll('input[name="orillaRellena"]').forEach(r => { r.checked = r.value === "No" })

  configuracionPizza = { tamano: null, precioBase: 0, maxIngredientes: 0, precioOrilla: 0, ingredientes: [], orilla: "No" }

  const ingredientesInfo = document.getElementById("ingredientesInfo")
  const orillaInfo = document.getElementById("orillaInfo")
  const orillaPrecioVisual = document.getElementById("orillaPrecioVisual")
  const mensaje = document.getElementById("mensajePizzaBuilder")

  if (ingredientesInfo) ingredientesInfo.textContent = "Primero elige un tamaño para saber cuántos ingredientes puedes seleccionar"
  if (orillaInfo) orillaInfo.textContent = "Selecciona primero un tamaño"
  if (orillaPrecioVisual) orillaPrecioVisual.textContent = "$0"
  if (mensaje) mensaje.textContent = ""

  actualizarResumenPizza()
}

function mostrarMensajePizzaBuilder(texto) {
  const mensaje = document.getElementById("mensajePizzaBuilder")
  if (!mensaje) return
  mensaje.textContent = texto
  clearTimeout(window.mensajePizzaTimeout)
  window.mensajePizzaTimeout = setTimeout(() => { mensaje.textContent = "" }, 2500)
}

function agregarCarrito(nombre, precio) {
  carrito.push({ nombre, precio })
  subtotal += precio
  actualizarCarrito()
  mostrarToast(`${nombre} se agregó al carrito`)
}

function actualizarCarrito() {
  const lista = document.getElementById("listaCarrito")
  const carritoVacio = document.getElementById("carritoVacio")
  const subtotalElemento = document.getElementById("subtotal")
  const totalElemento = document.getElementById("total")
  const cantidadProductos = document.getElementById("cantidadProductos")
  const contadorCarrito = document.getElementById("contadorCarrito")
  const resumenCuentaCarrito = document.getElementById("resumenCuentaCarrito")

  if (!lista) return
  lista.innerHTML = ""

  if (carrito.length === 0) {
    if (carritoVacio) { carritoVacio.style.display = "block"; carritoVacio.classList.add("visible") }
  } else {
    if (carritoVacio) { carritoVacio.style.display = "none"; carritoVacio.classList.remove("visible") }
  }

  carrito.forEach((item, index) => {
    const li = document.createElement("li")
    li.innerHTML = `
      <div>
        <div class="cr-item-nombre">${item.nombre}</div>
        <div class="cr-item-sub">Producto agregado a tu pedido</div>
      </div>
      <div class="cr-item-cantidad">
        <button onclick="cambiarCantidadCarrito(${index}, -1)">−</button>
        <span>1</span>
        <button onclick="cambiarCantidadCarrito(${index}, 1)">+</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span class="cr-item-precio">$${item.precio}</span>
        <button onclick="eliminarDelCarrito(${index})" style="background:transparent;border:none;color:#ff6b6b;cursor:pointer;font-size:18px;padding:4px" title="Quitar">✕</button>
      </div>
    `
    lista.appendChild(li)
  })

  if (subtotalElemento) subtotalElemento.textContent = `$${subtotal}`
  if (totalElemento) totalElemento.textContent = `$${subtotal}`
  if (cantidadProductos) cantidadProductos.textContent = carrito.length
  if (contadorCarrito) contadorCarrito.textContent = carrito.length
  if (resumenCuentaCarrito) resumenCuentaCarrito.textContent = carrito.length
  const accesoContador = document.getElementById("accesoContadorCarrito")
  if (accesoContador) accesoContador.textContent = carrito.length === 0 ? "0 productos" : carrito.length + " producto" + (carrito.length > 1 ? "s" : "")
}

function cambiarCantidadCarrito(index, delta) {
  // Por ahora solo elimina si baja a 0 (cada item es unitario)
  if (delta < 0) eliminarDelCarrito(index)
}

function eliminarDelCarrito(index) {
  if (index < 0 || index >= carrito.length) return
  const productoEliminado = carrito[index]
  subtotal -= productoEliminado.precio
  carrito.splice(index, 1)
  if (subtotal < 0) subtotal = 0
  actualizarCarrito()
  mostrarToast(`${productoEliminado.nombre} fue eliminado del carrito`)
}

function vaciarCarrito() {
  if (carrito.length === 0) { mostrarToast("Tu carrito ya está vacío"); return }
  carrito = []
  subtotal = 0
  actualizarCarrito()
  mostrarToast("Se vació el carrito")
}

function guardarDatosCuenta() {
  const correo = document.getElementById("correoCuenta")
  const telefono = document.getElementById("telefonoCuenta")
  if (correo) localStorage.setItem("correoCliente", correo.value.trim())
  if (telefono) localStorage.setItem("telefonoCliente", telefono.value.trim())
  mostrarToast("Tus datos de cuenta se guardaron correctamente")
}

function obtenerUbicacionActual() {
  if (!navigator.geolocation) { mostrarToast("Tu navegador no permite obtener la ubicación"); return }
  navigator.geolocation.getCurrentPosition(
    posicion => {
      const latitud = posicion.coords.latitude.toFixed(6)
      const longitud = posicion.coords.longitude.toFixed(6)
      localStorage.setItem("latitudCliente", latitud)
      localStorage.setItem("longitudCliente", longitud)
      const latitudTexto = document.getElementById("latitudCliente")
      const longitudTexto = document.getElementById("longitudCliente")
      const direccion = document.getElementById("direccion")
      if (latitudTexto) latitudTexto.textContent = latitud
      if (longitudTexto) longitudTexto.textContent = longitud
      if (direccion && direccion.value.trim() === "") {
        direccion.value = `Ubicación detectada. Latitud: ${latitud}, Longitud: ${longitud}`
      }
      mostrarToast("Ubicación actual obtenida correctamente")
    },
    () => { mostrarToast("No se pudo obtener tu ubicación") }
  )
}

function guardarDireccion() {
  const direccionInput = document.getElementById("direccion")
  const direccionGuardada = document.getElementById("direccionGuardada")
  if (!direccionInput) return
  const direccion = direccionInput.value.trim()
  if (direccion === "") { mostrarToast("Escribe una dirección o usa tu ubicación actual"); return }
  localStorage.setItem("direccion", direccion)
  if (direccionGuardada) direccionGuardada.textContent = "Ubicación guardada: " + direccion
  mostrarToast("Tu ubicación se guardó correctamente")
}





async function mostrarPedidosCliente() {
  const contenedor = document.getElementById("listaPedidosCliente")
  if (!contenedor) return

  let pedidos = []
  try {
    // Solo pedidos del usuario actual
    const todos = await API.Pedidos.listar()
    const usuarioId = localStorage.getItem("usuarioId")
    pedidos = usuarioId
      ? todos.filter(p => String(p.usuario_id) === String(usuarioId))
      : todos
  } catch (err) {
    console.warn("No se pudieron cargar pedidos:", err.message)
  }

  contenedor.innerHTML = ""

  if (pedidos.length === 0) {
    contenedor.innerHTML = `
      <div class="pd-vacio">
        <div class="pd-vacio-icon">📦</div>
        <h4>Sin pedidos activos</h4>
        <p>Tus pedidos recientes aparecerán aquí.</p>
      </div>`
    return
  }

  const estados  = ["Nuevo", "En preparación", "En camino", "Entregado"]
  const etiquetas = [
    { label: "Recibido",      icon: "✅" },
    { label: "En preparación", icon: "👨‍🍳" },
    { label: "En camino",     icon: "🛵" },
    { label: "Entregado",     icon: "🏠" }
  ]

  pedidos.reverse().forEach((pedido, idx) => {
    const indexActual  = estados.indexOf(pedido.estado)
    const estadoLabel  = pedido.estado === "Nuevo" ? "Pedido recibido" : pedido.estado
    const productosArr = Array.isArray(pedido.productos) ? pedido.productos : []

    const productosHtml = productosArr.map(p =>
      `<div class="pd-producto-row">
        <span>${p.nombre}</span>
        <span class="pd-precio">$${p.precio}</span>
      </div>`
    ).join("")

    const barraHtml = etiquetas.map((e, i) => {
      let clase = i < indexActual ? "completado" : i === indexActual ? "activo" : ""
      return `<div class="pd-paso ${clase}">
        <div class="pd-paso-icon">${e.icon}</div>
        <span>${e.label}</span>
      </div>`
    }).join("")

    const fecha = pedido.fecha_creado ? new Date(pedido.fecha_creado).toLocaleString() : "—"

    const card = document.createElement("div")
    card.className = "pd-card"
    card.innerHTML = `
      <div class="pd-card-header" onclick="pdToggle(this)">
        <div class="pd-card-header-left">
          <span class="pd-badge">${estadoLabel}</span>
          <div>
            <strong class="pd-card-titulo">Pedido #${pedido.id}</strong>
            <span class="pd-card-fecha">${fecha}</span>
          </div>
        </div>
        <div class="pd-card-header-right">
          <strong class="pd-card-total">$${pedido.total}</strong>
          <span class="pd-flecha">▾</span>
        </div>
      </div>
      <div class="pd-card-body">
        <div class="pd-barra">${barraHtml}</div>
        <div class="pd-detalle">
          <div class="pd-detalle-col">
            <p><span>Cliente</span><strong>${pedido.cliente_nombre || "—"}</strong></p>
            <p><span>Teléfono</span><strong>${pedido.telefono || "—"}</strong></p>
            <p><span>Dirección</span><strong>${pedido.direccion || "—"}</strong></p>
            <p><span>Tiempo estimado</span><strong>${pedido.tiempo_estimado || "30 a 35 minutos"}</strong></p>
          </div>
          <div class="pd-productos-col">
            <p class="pd-prod-titulo">Productos</p>
            ${productosHtml}
            <div class="pd-prod-total">
              <span>Total</span><strong>$${pedido.total}</strong>
            </div>
          </div>
        </div>
      </div>
    `
    contenedor.appendChild(card)
  })
}

function pdToggle(header) {
  const card = header.closest('.pd-card')
  const body = card.querySelector('.pd-card-body')
  const flecha = card.querySelector('.pd-flecha')
  const abierto = card.classList.toggle('pd-abierto')
  body.style.maxHeight = abierto ? body.scrollHeight + 'px' : '0'
  flecha.style.transform = abierto ? 'rotate(180deg)' : 'rotate(0)'
}

async function obtenerEstadoPedidoActual() {
  await mostrarPedidosCliente()
  ctRenderOrders()
}

async function realizarPedido() {
  const horaActual = new Date().getHours()
  if (horaActual < 16 || horaActual >= 23) {
    mostrarToast("⏰ Solo recibimos pedidos de 4:00 PM a 11:00 PM")
    const mensajeHorario = document.getElementById("mensajeHorario")
    if (mensajeHorario) mensajeHorario.style.display = "flex"
    return
  }
  if (carrito.length === 0) {
    mostrarToast("Agrega productos al carrito antes de realizar tu pedido")
    mostrarSeccion("menu"); return
  }
  const nombreCliente   = localStorage.getItem("nombreCliente")   || "Cliente"
  const telefonoCliente = localStorage.getItem("telefonoCliente") || ""
  const direccionCliente = localStorage.getItem("direccion")      || ""
  const latitudCliente  = localStorage.getItem("latitudCliente")  || null
  const longitudCliente = localStorage.getItem("longitudCliente") || null
  const usuarioId       = localStorage.getItem("usuarioId")       || null

  if (!direccionCliente) {
    mostrarToast("Primero guarda tu ubicación en Mi cuenta")
    mostrarSeccion("cuenta"); return
  }
  if (subtotal < 150) {
    mostrarToast("El pedido mínimo para envío es de $150")
    mostrarSeccion("carrito"); return
  }

  mostrarToast("Enviando pedido...")
  try {
    const pedido = await API.Pedidos.crear({
      usuario_id:     usuarioId,
      cliente_nombre: nombreCliente,
      telefono:       telefonoCliente,
      direccion:      direccionCliente,
      latitud:        latitudCliente,
      longitud:       longitudCliente,
      productos:      carrito.map(p => ({ nombre: p.nombre, precio: p.precio, cantidad: 1 }))
    })
    // Guardar id localmente para seguimiento
    const ids = JSON.parse(localStorage.getItem("pedidosActivosIds") || "[]")
    ids.push(pedido.id)
    localStorage.setItem("pedidosActivosIds", JSON.stringify(ids))

    carrito = []
    subtotal = 0
    actualizarCarrito()
    mostrarToast("Pedido realizado con éxito. Tiempo estimado: 30 a 35 minutos 🍕")
    await mostrarPedidosCliente()
    setTimeout(() => { mostrarSeccion("carrito") }, 400)
  } catch (err) {
    mostrarToast("Error al enviar el pedido: " + err.message)
  }
}

function cerrarSesion() {
  mostrarToast("Sesión cerrada")
  setTimeout(() => { window.location.href = "login.html" }, 900)
}

function mostrarToast(mensaje) {
  const toast = document.getElementById("toast")
  if (!toast) return
  toast.textContent = mensaje
  toast.classList.add("show")
  clearTimeout(window.toastTimeout)
  window.toastTimeout = setTimeout(() => { toast.classList.remove("show") }, 2500)
}

window.addEventListener("storage", e => {
  if (e.key === "pedidosPizzaGo" || e.key === "pedidosActivosIds") {
    obtenerEstadoPedidoActual()
    mostrarPedidosCliente()
  }
})

document.addEventListener("DOMContentLoaded", async () => {
  // Verificar sesión
  if (!API.getToken()) {
    window.location.href = "login.html"
    return
  }

  const nombre    = localStorage.getItem("nombreCliente")  || "Cliente"
  const correo    = localStorage.getItem("correoCliente")  || ""
  const telefono  = localStorage.getItem("telefonoCliente")|| ""
  const direccion = localStorage.getItem("direccion")      || ""
  const latitud   = localStorage.getItem("latitudCliente") || "No registrada"
  const longitud  = localStorage.getItem("longitudCliente")|| "No registrada"

  const set = (id, val) => { const el = document.getElementById(id); if (el) { if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = val; else el.textContent = val } }

  set("nombreUsuario",      nombre)
  set("nombreCuentaTexto",  nombre)
  set("correoCuenta",       correo)
  set("telefonoCuenta",     telefono)
  set("direccion",          direccion)
  set("latitudCliente",     latitud)
  set("longitudCliente",    longitud)

  if (direccion) {
    const el = document.getElementById("direccionGuardada")
    if (el) el.textContent = "Ubicación guardada: " + direccion
  }

  const navTabs = document.querySelector(".nav-tabs")
  if (navTabs) navTabs.style.display = "none"

  const hora = new Date().getHours()
  const saludoEl = document.getElementById("saludoTiempo")
  const nombreBienvenida = document.getElementById("nombreBienvenida")
  if (saludoEl) {
    if (hora >= 5 && hora < 12)       saludoEl.textContent = "¡Buenos días! ☀️"
    else if (hora >= 12 && hora < 19) saludoEl.textContent = "¡Buenas tardes! 🌤️"
    else                              saludoEl.textContent = "¡Buenas noches! 🌙"
  }
  if (nombreBienvenida) nombreBienvenida.textContent = nombre

  ctActualizarSidebar()
  iniciarConstructorPizza()
  actualizarResumenPizza()
  actualizarCarrito()
  await obtenerEstadoPedidoActual()

  setInterval(() => { obtenerEstadoPedidoActual() }, 8000)
})

// =====================
// TABS MENÚ
// =====================
function cambiarCategoriaMenu(categoria, boton) {
  // Ocultar todas las categorías
  document.querySelectorAll('.mn-categoria').forEach(el => el.style.display = 'none')
  // Desactivar todas las pestañas
  document.querySelectorAll('.mn-tab').forEach(el => el.classList.remove('active'))
  // Mostrar la categoría seleccionada
  document.getElementById('cat-' + categoria).style.display = 'block'
  // Activar pestaña
  boton.classList.add('active')
}

// =====================
// MODAL DETALLE PIZZA
// =====================
let modalCantidad = 1
let modalNombreBase = ''

function abrirPizzaModal(img, nombre, desc) {
  modalNombreBase = nombre
  modalCantidad = 1

  document.getElementById('pzImgPrincipal').src = img
  document.getElementById('pzNombre').textContent = nombre
  document.getElementById('pzDesc').textContent = desc
  document.getElementById('pzCantidad').textContent = 1

  // Reset selecciones
  document.querySelector('input[name="pzTamano"][value="99"]').checked = true
  document.querySelector('input[name="pzOrilla"][value="0"]').checked = true

  actualizarTotalModal()
  document.getElementById('pizzaModal').classList.add('activo')
  document.body.style.overflow = 'hidden'
}

function cerrarPizzaModal(e) {
  if (e && e.target !== document.getElementById('pizzaModal') && !e.target.classList.contains('pz-close')) return
  document.getElementById('pizzaModal').classList.remove('activo')
  document.body.style.overflow = ''
}

function actualizarTotalModal() {
  const tamanoInput = document.querySelector('input[name="pzTamano"]:checked')
  const tamano = parseInt(tamanoInput.value) || 99
  const orillaCosto = parseInt(tamanoInput.dataset.orilla) || 30
  const orilaOpt = document.querySelector('input[name="pzOrilla"]:checked')
  // Si eligió orilla de queso, cobrar el precio según tamaño; si es tradicional = 0
  const orilla = (orilaOpt && orilaOpt.value === 'orilla') ? orillaCosto : 0

  // Actualizar etiqueta de precio de orilla
  const label = document.getElementById('pzOrillaPrecioLabel')
  if (label) label.textContent = '+ $' + orillaCosto

  const total = (tamano + orilla) * modalCantidad
  document.getElementById('pzTotal').textContent = '$' + total.toFixed(2) + ' MXN'
  return { tamano, orilla, total }
}

function cambiarCantidadModal(delta) {
  modalCantidad = Math.max(1, modalCantidad + delta)
  document.getElementById('pzCantidad').textContent = modalCantidad
  actualizarTotalModal()
}

function agregarDesdeModal() {
  const tamanoInput = document.querySelector('input[name="pzTamano"]:checked')
  const orillaCosto = parseInt(tamanoInput.dataset.orilla) || 30
  const orilaOpt = document.querySelector('input[name="pzOrilla"]:checked')
  const tieneOrilla = orilaOpt && orilaOpt.value === 'orilla'
  const orilla = tieneOrilla ? orillaCosto : 0
  const tamanoLabel = tamanoInput.dataset.label
  const tamanoPrice = parseInt(tamanoInput.value)
  const precioUnitario = tamanoPrice + orilla
  const nombreCompleto = modalNombreBase + ' (' + tamanoLabel + (tieneOrilla ? ' + Orilla' : '') + ')'

  for (let i = 0; i < modalCantidad; i++) {
    agregarCarrito(nombreCompleto, precioUnitario)
  }

  document.getElementById('pizzaModal').classList.remove('activo')
  document.body.style.overflow = ''
}

// Actualizar total al cambiar opciones
document.addEventListener('change', function(e) {
  if (e.target.name === 'pzTamano' || e.target.name === 'pzOrilla') {
    actualizarTotalModal()
  }
})

// =====================
// PERSONALIZADOR MITAD Y MITAD
// =====================
let psSlots = 2
let psPrecioBase = 0

document.addEventListener('change', function(e) {
  // Cambio de tamaño
  if (e.target.name === 'psTamano') {
    const input = e.target
    psSlots = parseInt(input.dataset.slots)
    psPrecioBase = parseInt(input.dataset.precio)

    // Mostrar/ocultar slots
    for (let i = 1; i <= 4; i++) {
      const slot = document.getElementById('psSlot' + i)
      const mitad = document.getElementById('psMitad' + i)
      if (slot) slot.style.display = i <= psSlots ? 'block' : 'none'
      if (mitad) mitad.style.display = i <= psSlots ? 'block' : 'none'
    }

    // Ajustar grid de mitades
    const mitadesBox = document.getElementById('psMitades')
    if (mitadesBox) {
      mitadesBox.style.gridTemplateColumns = psSlots === 4 ? 'repeat(2,1fr)' : 'repeat(2,1fr)'
      mitadesBox.dataset.slots = psSlots
    }

    // Habilitar paso sabores
    const paso = document.getElementById('psPasoSabores')
    if (paso) { paso.style.opacity = '1'; paso.style.pointerEvents = 'all' }
    const badge = document.getElementById('psSaboresInfo')
    if (badge) badge.textContent = psSlots === 4 ? '4 secciones' : '2 mitades'

    actualizarResumenPs()
  }

  // Cambio de orilla
  if (e.target.name === 'psOrilla') actualizarResumenPs()

  // Cambio de sabor
  if (e.target.name && e.target.name.startsWith('psSabor')) {
    const slot = parseInt(e.target.name.replace('psSabor',''))
    const img = e.target.dataset.img
    const nombre = e.target.value
    const imgEl = document.getElementById('psImg' + slot)
    const labelEl = document.getElementById('psLabel' + slot)
    if (imgEl) { imgEl.src = img; imgEl.style.opacity = '1' }
    if (labelEl) labelEl.textContent = nombre
    actualizarResumenPs()
  }
})

function actualizarResumenPs() {
  const orilla = parseInt(document.querySelector('input[name="psOrilla"]:checked')?.value || 0)
  const total = psPrecioBase + orilla
  const totalEl = document.getElementById('psTotalTexto')
  if (totalEl) totalEl.textContent = total > 0 ? '$' + total.toFixed(2) + ' MXN' : '$0.00 MXN'

  // Resumen texto
  const sabores = []
  for (let i = 1; i <= psSlots; i++) {
    const sel = document.querySelector(`input[name="psSabor${i}"]:checked`)
    if (sel) sabores.push(sel.value)
  }
  const tamanoInput = document.querySelector('input[name="psTamano"]:checked')
  const tamanoNombre = tamanoInput ? tamanoInput.value.charAt(0).toUpperCase() + tamanoInput.value.slice(1) : ''
  const resumen = document.getElementById('psResumenTexto')
  if (resumen) {
    resumen.textContent = tamanoNombre
      ? `Pizza ${tamanoNombre} · ${sabores.length}/${psSlots} sabores elegidos`
      : 'Selecciona un tamaño para comenzar'
  }
}

function agregarPizzaPersonalizada() {
  const tamanoInput = document.querySelector('input[name="psTamano"]:checked')
  if (!tamanoInput) { mostrarToast('Selecciona un tamaño primero'); return }

  const sabores = []
  for (let i = 1; i <= psSlots; i++) {
    const sel = document.querySelector(`input[name="psSabor${i}"]:checked`)
    if (!sel) { mostrarToast(`Elige el sabor para la sección ${i}`); return }
    sabores.push(sel.value)
  }

  const orilla = parseInt(document.querySelector('input[name="psOrilla"]:checked')?.value || 0)
  const tamanoNombre = tamanoInput.value.charAt(0).toUpperCase() + tamanoInput.value.slice(1)
  const precio = psPrecioBase + orilla
  const nombre = `Pizza ${tamanoNombre} (${sabores.join(' / ')}${orilla > 0 ? ' + Orilla' : ''})`

  agregarCarrito(nombre, precio)
  mostrarSeccion('carrito')
}

// =====================
// CUENTA — PANELES
// =====================
function ctMostrarPanel(panel) {
  document.querySelectorAll('.ct-panel').forEach(p => p.style.display = 'none')
  document.querySelectorAll('.ct-nav-btn').forEach(b => b.classList.remove('active'))
  const el = document.getElementById('ct-panel-' + panel)
  if (el) el.style.display = 'block'
  const btns = document.querySelectorAll('.ct-nav-btn')
  const idx = ['info','ubicacion','pedidos','preferencias'].indexOf(panel)
  if (btns[idx]) btns[idx].classList.add('active')
}

function ctActualizarSidebar() {
  const nombre = localStorage.getItem('nombreCliente') || 'Cliente'
  const correo = localStorage.getItem('correoCliente') || '—'
  const nd = document.getElementById('ctNombreDisplay')
  const cd = document.getElementById('ctCorreoDisplay')
  if (nd) nd.textContent = nombre
  if (cd) cd.textContent = correo
}

// =====================
// TABLA DE ÓRDENES RECIENTES
// =====================
const estadoConfig = {
  "Nuevo":          { label: "Recibido",      color: "#f6c400", bg: "rgba(246,196,0,0.12)" },
  "En preparación": { label: "Preparando",    color: "#4da6ff", bg: "rgba(77,166,255,0.12)" },
  "En camino":      { label: "En camino",     color: "#ff9f43", bg: "rgba(255,159,67,0.12)" },
  "Entregado":      { label: "Entregado",     color: "#4caf88", bg: "rgba(76,175,136,0.12)" },
}

async function ctRenderOrders() {
  const body = document.getElementById("ctOrdersBody")
  if (!body) return

  let pedidos = []
  try {
    const todos = await API.Pedidos.listar()
    const uid   = localStorage.getItem("usuarioId")
    pedidos = uid ? todos.filter(p => String(p.usuario_id) === String(uid)) : todos
  } catch (e) {
    body.innerHTML = `<div class="ct-orders-vacio">No se pudieron cargar pedidos.</div>`
    return
  }

  if (pedidos.length === 0) {
    body.innerHTML = `<div class="ct-orders-vacio">No tienes pedidos registrados aún.</div>`
    return
  }

  body.innerHTML = [...pedidos].reverse().map((p, i) => {
    const cfg   = estadoConfig[p.estado] || estadoConfig["Nuevo"]
    const folio = "#" + String(pedidos.length - i).padStart(4, "0")
    return `
      <div class="ct-order-row">
        <span class="ct-order-id">${folio}</span>
        <span class="ct-order-fecha">${p.fecha_creado ? new Date(p.fecha_creado).toLocaleString() : "—"}</span>
        <span>
          <span class="ct-order-badge" style="color:${cfg.color};background:${cfg.bg};border-color:${cfg.color}30">
            ${cfg.label}
          </span>
        </span>
        <span class="ct-order-total">$${p.total}</span>
        <span>
          <button class="ct-order-eye" onclick="ctVerPedido(${p.id})" title="Ver detalle">👁</button>
        </span>
      </div>`
  }).join("")
}

function ctVerPedido(id) {
  const pedidos = JSON.parse(localStorage.getItem("pedidosPizzaGo")) || []
  const p = pedidos.find(x => x.id == id)
  if (!p) return

  const idxOriginal = pedidos.findIndex(x => x.id == id)
  const folio = "#" + String(idxOriginal + 1).padStart(4, "0")

  const cfg = estadoConfig[p.estado] || estadoConfig["Nuevo"]
  const estados = ["Nuevo","En preparación","En camino","Entregado"]
  const etiquetas = [
    { label: "Recibido", icon: "✅" },
    { label: "Preparando", icon: "👨‍🍳" },
    { label: "En camino", icon: "🛵" },
    { label: "Entregado", icon: "🏠" },
  ]
  const idx = estados.indexOf(p.estado)

  const barraHtml = etiquetas.map((e, i) => {
    let cls = i < idx ? "completado" : i === idx ? "activo" : ""
    return `<div class="pd-paso ${cls}">
      <div class="pd-paso-icon">${e.icon}</div>
      <span>${e.label}</span>
    </div>`
  }).join("")

  const productosHtml = p.productos.map(pr =>
    `<div class="pd-producto-row"><span>${pr.nombre}</span><span class="pd-precio">$${pr.precio}</span></div>`
  ).join("")

  const box = document.getElementById("ctPedidoModalBox")
  box.innerHTML = `
    <div class="ct-modal-header">
      <div>
        <h3>Pedido ${folio}</h3>
        <span style="font-size:12px;color:var(--text-muted)">${p.fecha}</span>
      </div>
      <button class="ct-modal-close" onclick="ctCerrarModalBtn()">✕</button>
    </div>

    <div class="pd-barra" style="margin:0 -28px;padding:20px 28px;background:rgba(255,255,255,0.015);border-bottom:1px solid rgba(255,255,255,0.06)">
      ${barraHtml}
    </div>

    <div class="ct-modal-body">
      <div class="ct-modal-col">
        <p class="ct-modal-section">Información del pedido</p>
        <div class="ct-modal-rows">
          <div class="ct-modal-row"><span>Cliente</span><strong>${p.cliente}</strong></div>
          <div class="ct-modal-row"><span>Teléfono</span><strong>${p.telefono}</strong></div>
          <div class="ct-modal-row"><span>Dirección</span><strong>${p.direccion}</strong></div>
          <div class="ct-modal-row"><span>Tiempo estimado</span><strong>${p.tiempoEstimado}</strong></div>
          <div class="ct-modal-row"><span>Estado</span>
            <strong style="color:${cfg.color}">${cfg.label}</strong>
          </div>
        </div>
      </div>
      <div class="ct-modal-col">
        <p class="ct-modal-section">Productos</p>
        ${productosHtml}
        <div class="pd-prod-total" style="margin-top:12px">
          <span>Total</span><strong>$${p.total}</strong>
        </div>
      </div>
    </div>
  `
  document.getElementById("ctPedidoModal").classList.add("visible")
}

function ctCerrarModal(e) {
  if (e && e.target.id !== "ctPedidoModal") return
  document.getElementById("ctPedidoModal").classList.remove("visible")
}

function ctCerrarModalBtn() {
  document.getElementById("ctPedidoModal").classList.remove("visible")
}