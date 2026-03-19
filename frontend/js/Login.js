// Login.js — conectado al API Gateway

class Login {
  constructor () {
    this.form     = document.getElementById('loginForm')
    this.usuario  = document.getElementById('usuario')
    this.password = document.getElementById('password')
    this.mensaje  = document.getElementById('mensaje')
    this.form.addEventListener('submit', (e) => this.iniciarSesion(e))
  }

  mostrarMensaje (texto, ok = false) {
    this.mensaje.textContent = texto
    this.mensaje.className = 'lg-mensaje' + (ok ? ' ok' : '')
  }

  validarCampos () {
    if (!this.usuario.value.trim() || !this.password.value.trim()) {
      this.mostrarMensaje('Completa todos los campos')
      return false
    }
    return true
  }

  async iniciarSesion (e) {
    e.preventDefault()
    if (!this.validarCampos()) return
    this.mostrarMensaje('Verificando...')
    try {
      await API.Usuarios.login(this.usuario.value.trim(), this.password.value.trim())
      this.mostrarMensaje('¡Bienvenido! Redirigiendo...', true)
      setTimeout(() => { window.location.href = 'cliente.html' }, 900)
    } catch (err) {
      this.mostrarMensaje(err.message || 'Usuario o contraseña incorrectos')
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new Login())
