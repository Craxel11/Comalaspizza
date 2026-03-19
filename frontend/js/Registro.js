// Registro.js — conectado al API Gateway

function togglePass(id, btn) {
  const input = document.getElementById(id)
  input.type = input.type === 'password' ? 'text' : 'password'
  btn.style.opacity = input.type === 'text' ? '0.9' : '0.4'
}

class Registro {
  constructor () {
    this.form              = document.getElementById('registroForm')
    this.nombre            = document.getElementById('nombre')
    this.usuario           = document.getElementById('usuario')
    this.password          = document.getElementById('password')
    this.confirmarPassword = document.getElementById('confirmarPassword')
    this.mensaje           = document.getElementById('mensaje')
    this.form.addEventListener('submit', (e) => this.registrar(e))
  }

  mostrarMensaje (texto, ok = false) {
    this.mensaje.textContent = texto
    this.mensaje.className = 'rg-mensaje' + (ok ? ' ok' : '')
  }

  validarUsuario (v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^[0-9]{10}$/.test(v)
  }

  validarFormulario () {
    const { nombre, usuario, password, confirmarPassword } = this
    if (!nombre.value.trim() || !usuario.value.trim() ||
        !password.value.trim() || !confirmarPassword.value.trim()) {
      this.mostrarMensaje('Completa todos los campos'); return false
    }
    if (!this.validarUsuario(usuario.value.trim())) {
      this.mostrarMensaje('Ingresa un correo válido o número de 10 dígitos'); return false
    }
    if (password.value.trim().length < 6) {
      this.mostrarMensaje('La contraseña debe tener al menos 6 caracteres'); return false
    }
    if (password.value !== confirmarPassword.value) {
      this.mostrarMensaje('Las contraseñas no coinciden'); return false
    }
    return true
  }

  async registrar (e) {
    e.preventDefault()
    if (!this.validarFormulario()) return
    this.mostrarMensaje('Creando cuenta...')
    try {
      await API.Usuarios.registro(
        this.nombre.value.trim(),
        this.usuario.value.trim(),
        this.password.value.trim(),
        this.usuario.value.trim()
      )
      this.mostrarMensaje('¡Cuenta creada! Entrando...', true)
      setTimeout(() => { window.location.href = 'cliente.html' }, 1100)
    } catch (err) {
      this.mostrarMensaje(err.message || 'Error al registrar, intenta de nuevo')
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new Registro())
