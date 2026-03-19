// mostrador.js — conectado al API Gateway

let filtroActual = 'todos'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function siguienteEstado(e) {
  if (e === 'Nuevo')          return 'En preparación'
  if (e === 'En preparación') return 'En camino'
  if (e === 'En camino')      return 'Entregado'
  return 'Entregado'
}

function badgeClase(estado) {
  if (estado === 'Nuevo')          return 'badge-Nuevo'
  if (estado === 'En preparación') return 'badge-preparacion'
  if (estado === 'En camino')      return 'badge-camino'
  if (estado === 'Entregado')      return 'badge-Entregado'
  return 'badge-Nuevo'
}

function folio(idx) {
  return '#' + String(idx + 1).padStart(4, '0')
}

function setText(id, val) {
  const el = document.getElementById(id)
  if (el) el.textContent = val
}

function mostrarToast(msg) {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.classList.add('show')
  clearTimeout(window._toast)
  window._toast = setTimeout(() => t.classList.remove('show'), 2500)
}

// ─── Render tarjeta de pedido ─────────────────────────────────────────────────
function renderCard(pedido, idx) {
  const productos = Array.isArray(pedido.productos) ? pedido.productos : []
  const productosHtml = productos.map(p =>
    `<div class="ms-prod-row"><span>${p.nombre}</span><strong>$${p.precio}</strong></div>`
  ).join('')

  const entregado = pedido.estado === 'Entregado'
  const btnLabel  = entregado ? '✓ Entregado' : `Marcar: ${siguienteEstado(pedido.estado)}`

  const estiloIzq = {
    'Nuevo':          'border-left:3px solid var(--gold)',
    'En preparación': 'border-left:3px solid var(--orange)',
    'En camino':      'border-left:3px solid var(--blue)',
    'Entregado':      'border-left:3px solid var(--green)'
  }[pedido.estado] || ''

  return `
    <div class="ms-card" data-estado="${pedido.estado}" data-id="${pedido.id}" style="${estiloIzq}">
      <div class="ms-card-top">
        <div>
          <div class="ms-card-folio">${folio(idx)}</div>
          <div class="ms-card-fecha">${pedido.fecha_creado ? new Date(pedido.fecha_creado).toLocaleString() : ''}</div>
        </div>
        <div class="ms-card-top-right">
          <span class="ms-estado-badge ${badgeClase(pedido.estado)}">${pedido.estado}</span>
          <button class="ms-card-delete" onclick="eliminarPedido(${pedido.id})" title="Eliminar">✕</button>
        </div>
      </div>
      <div class="ms-card-cliente">
        <strong>${pedido.cliente_nombre || pedido.cliente || '—'}</strong>
        <span>📞 ${pedido.telefono || '—'}</span>
        <span>📍 ${pedido.direccion || '—'}</span>
      </div>
      <div class="ms-card-productos">${productosHtml}</div>
      <div class="ms-card-bottom">
        <div class="ms-card-total">Total: <strong>$${pedido.total}</strong></div>
        <button
          class="ms-btn-estado ${entregado ? 'ms-btn-done' : ''}"
          onclick="cambiarEstado(${pedido.id})"
          ${entregado ? 'disabled' : ''}>
          ${btnLabel}
        </button>
      </div>
    </div>`
}

// ─── Cargar pedidos desde la API ──────────────────────────────────────────────
let _pedidosCache = []

async function cargarPedidos() {
  try {
    _pedidosCache = await API.Pedidos.listar()
  } catch (err) {
    console.error('[Mostrador] Error cargando pedidos:', err.message)
    _pedidosCache = []
  }
  renderPedidos(_pedidosCache)
}

function renderPedidos(pedidos) {
  const lista  = document.getElementById('listaPedidos')
  const sinPed = document.getElementById('sinPedidos')
  if (!lista) return

  const nuevos     = pedidos.filter(p => p.estado === 'Nuevo').length
  const prep       = pedidos.filter(p => p.estado === 'En preparación').length
  const camino     = pedidos.filter(p => p.estado === 'En camino').length
  const activos    = pedidos.filter(p => p.estado !== 'Entregado').length
  const entregados = pedidos.filter(p => p.estado === 'Entregado').length

  setText('totalPedidos',       pedidos.length)
  setText('pedidosNuevos',      nuevos)
  setText('pedidosPreparacion', prep)
  setText('pedidosCamino',      camino)
  setText('msBadgeActivos',     activos + ' Activos')
  setText('msBadgeNuevos',      nuevos + ' Nuevos')
  setText('tabTodos',           pedidos.length)
  setText('tabNuevos',          nuevos)
  setText('tabPrep',            prep)
  setText('tabCamino',          camino)
  setText('tabEntregado',       entregados)

  let filtrados = [...pedidos].reverse()
  if (filtroActual !== 'todos') {
    filtrados = filtrados.filter(p => p.estado === filtroActual)
  }

  if (filtrados.length === 0) {
    sinPed.style.display = 'block'
    lista.innerHTML = ''
  } else {
    sinPed.style.display = 'none'
    lista.innerHTML = filtrados.map((p, i) => {
      const idxOriginal = pedidos.findIndex(x => x.id === p.id)
      return renderCard(p, idxOriginal)
    }).join('')
  }
}

// ─── Cambiar estado via API ───────────────────────────────────────────────────
async function cambiarEstado(idPedido) {
  const pedido = _pedidosCache.find(p => p.id == idPedido)
  if (!pedido || pedido.estado === 'Entregado') return

  const nuevoEstado = siguienteEstado(pedido.estado)
  try {
    await API.Pedidos.cambiarEstado(idPedido, nuevoEstado)
    mostrarToast(`Pedido actualizado → ${nuevoEstado}`)
    cargarPedidos()
  } catch (err) {
    mostrarToast('Error al actualizar el pedido')
    console.error(err)
  }
}

// ─── Eliminar pedido via API ──────────────────────────────────────────────────
async function eliminarPedido(idPedido) {
  try {
    await API.Pedidos.eliminar(idPedido)
    mostrarToast('Pedido eliminado')
    cargarPedidos()
  } catch (err) {
    mostrarToast('Error al eliminar el pedido')
  }
}

// ─── Cerrar sesión ────────────────────────────────────────────────────────────
function cerrarSesionMostrador() {
  localStorage.removeItem('sesionMostrador')
  API.Usuarios.logout()
  mostrarToast('Sesión cerrada')
  setTimeout(() => { window.location.href = 'mostrador-login.html' }, 900)
}

// ─── Filtro tabs ──────────────────────────────────────────────────────────────
function msFiltrar(estado, btn) {
  filtroActual = estado
  document.querySelectorAll('.ms-tab').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  renderPedidos(_pedidosCache)
}

// ─── Paneles sidebar ──────────────────────────────────────────────────────────
function msSetTab(panel, btn) {
  document.querySelectorAll('.ms-panel').forEach(p => p.style.display = 'none')
  document.querySelectorAll('.ms-nav-btn').forEach(b => b.classList.remove('active'))
  document.getElementById('ms-panel-' + panel).style.display = 'block'
  const tabsPedidos = document.getElementById('ms-tabs-pedidos')
  if (tabsPedidos) tabsPedidos.style.display = panel === 'pedidos' ? 'flex' : 'none'
  btn.classList.add('active')
  if (panel === 'historial') renderHistorial()
  if (panel === 'settings')  renderSettings()
}

// ─── Historial ────────────────────────────────────────────────────────────────
function renderHistorial() {
  const lista = document.getElementById('msHistorialLista')
  if (!lista) return
  if (_pedidosCache.length === 0) {
    lista.innerHTML = '<div class="ms-hist-vacio">No hay pedidos en el historial.</div>'
    return
  }
  lista.innerHTML = [..._pedidosCache].reverse().map((p, i) => {
    const idxOrig = _pedidosCache.length - 1 - i
    const prods = Array.isArray(p.productos) ? p.productos.map(x => x.nombre).join(', ') : ''
    return `
      <div class="ms-hist-row">
        <span class="ms-hist-id">#${String(idxOrig + 1).padStart(4,'0')}</span>
        <span class="ms-hist-cli">${p.cliente_nombre || p.cliente || '—'}</span>
        <span class="ms-hist-prod">${prods}</span>
        <span class="ms-hist-tot">$${p.total}</span>
        <span class="ms-hist-est">
          <span class="ms-estado-badge ${badgeClase(p.estado)}">${p.estado}</span>
        </span>
      </div>`
  }).join('')
}

async function msLimpiarHistorial() {
  if (!confirm('¿Eliminar todos los pedidos del historial?')) return
  try {
    await Promise.all(_pedidosCache.map(p => API.Pedidos.eliminar(p.id)))
    mostrarToast('Historial limpiado')
    cargarPedidos()
    renderHistorial()
  } catch (err) {
    mostrarToast('Error al limpiar historial')
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function renderSettings() {
  const usuario = API.getUsuario()
  if (!usuario) return
  const nd = document.getElementById('msAdminNombre')
  const cd = document.getElementById('msAdminCorreo')
  if (nd) nd.textContent = usuario.nombre || '—'
  if (cd) cd.textContent = usuario.usuario || '—'
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('sesionMostrador')) {
    window.location.href = 'mostrador-login.html'
    return
  }
  cargarPedidos()
  // Recargar pedidos cada 8 segundos (actualizaciones del equipo de automatización)
  setInterval(cargarPedidos, 8000)
})
