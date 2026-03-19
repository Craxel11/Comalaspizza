// mostrador-login.js — conectado al API Gateway

function mlTogglePass() {
  const input = document.getElementById('passwordMostrador')
  const btn   = document.querySelector('.ml-eye')
  input.type = input.type === 'password' ? 'text' : 'password'
  btn.style.opacity = input.type === 'text' ? '0.9' : '0.35'
}

class MostradorLogin {
  constructor () {
    this.form     = document.getElementById('mostradorLoginForm')
    this.usuario  = document.getElementById('usuarioMostrador')
    this.password = document.getElementById('passwordMostrador')
    this.mensaje  = document.getElementById('mensajeMostrador')
    this.form.addEventListener('submit', (e) => this.iniciarSesion(e))
  }

  mostrarMensaje (texto, ok = false) {
    this.mensaje.textContent = texto
    this.mensaje.className = 'ml-mensaje' + (ok ? ' ok' : '')
  }

  async iniciarSesion (e) {
    e.preventDefault()
    const u = this.usuario.value.trim()
    const p = this.password.value.trim()
    if (!u || !p) { this.mostrarMensaje('Completa todos los campos'); return }

    this.mostrarMensaje('Verificando...')
    try {
      const data = await API.Usuarios.login(u, p)
      // Solo permiten acceso si el rol es mostrador o admin
      if (data.usuario.rol !== 'mostrador' && data.usuario.rol !== 'admin') {
        API.Usuarios.logout()
        this.mostrarMensaje('No tienes permisos de mostrador')
        return
      }
      localStorage.setItem('sesionMostrador', 'activa')
      this.mostrarMensaje('Acceso correcto. Entrando al panel...', true)
      setTimeout(() => { window.location.href = 'mostrador.html' }, 900)
    } catch (err) {
      this.mostrarMensaje(err.message || 'Usuario o contraseña incorrectos')
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new MostradorLogin())
