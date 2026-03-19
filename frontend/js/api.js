// ═══════════════════════════════════════════════════════
//  api.js — Capa de comunicación con el API Gateway
//  Todos los JS del frontend importan desde aquí
// ═══════════════════════════════════════════════════════

const API_URL = 'http://localhost:3000'

// ─── Token helpers ───────────────────────────────────────────────────────────
function getToken () { return localStorage.getItem('token') }
function getUsuario () { return JSON.parse(localStorage.getItem('usuarioActual') || 'null') }

function authHeaders () {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

// ─── Petición genérica con manejo de errores ─────────────────────────────────
async function request (method, path, body = null) {
  const opts = { method, headers: authHeaders() }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(API_URL + path, opts)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// ════════════════════════════════════════════════════════
//  USUARIOS
// ════════════════════════════════════════════════════════
const Usuarios = {
  async registro (nombre, usuario, password, telefono) {
    const data = await request('POST', '/api/usuarios/registro', { nombre, usuario, password, telefono })
    localStorage.setItem('token', data.token)
    localStorage.setItem('usuarioActual', JSON.stringify(data.usuario))
    // compatibilidad con keys que ya usa el frontend
    localStorage.setItem('nombreCliente', data.usuario.nombre)
    localStorage.setItem('usuarioCliente', data.usuario.usuario)
    localStorage.setItem('telefonoCliente', data.usuario.telefono || usuario)
    localStorage.setItem('usuarioId', data.usuario.id)
    return data
  },

  async login (usuario, password) {
    const data = await request('POST', '/api/usuarios/login', { usuario, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('usuarioActual', JSON.stringify(data.usuario))
    localStorage.setItem('nombreCliente', data.usuario.nombre)
    localStorage.setItem('usuarioCliente', data.usuario.usuario)
    localStorage.setItem('telefonoCliente', data.usuario.telefono || usuario)
    localStorage.setItem('usuarioId', data.usuario.id)
    return data
  },

  async actualizarPerfil (id, telefono, direccion, latitud, longitud) {
    return request('PUT', `/api/usuarios/perfil/${id}`, { telefono, direccion, latitud, longitud })
  },

  logout () {
    localStorage.removeItem('token')
    localStorage.removeItem('usuarioActual')
  }
}

// ════════════════════════════════════════════════════════
//  MENÚ
// ════════════════════════════════════════════════════════
const Menu = {
  async obtener (categoria = null) {
    const qs = categoria ? `?categoria=${categoria}` : ''
    return request('GET', `/api/menu${qs}`)
  }
}

// ════════════════════════════════════════════════════════
//  PEDIDOS
// ════════════════════════════════════════════════════════
const Pedidos = {
  async listar () {
    return request('GET', '/api/pedidos')
  },

  async crear (datos) {
    return request('POST', '/api/pedidos', datos)
  },

  async cambiarEstado (id, estado) {
    return request('PUT', `/api/pedidos/${id}/estado`, { estado })
  },

  async eliminar (id) {
    return request('DELETE', `/api/pedidos/${id}`)
  }
}

// ─── Exponer globalmente (los HTML usan scripts sin módulos) ─────────────────
window.API = { Usuarios, Menu, Pedidos, getUsuario, getToken }
