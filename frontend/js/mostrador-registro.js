// mostrador-registro.js — conectado al API Gateway

function mrTogglePass() {
  const input = document.getElementById('mrPassword')
  const btn   = document.querySelector('.mr-eye')
  input.type = input.type === 'password' ? 'text' : 'password'
  btn.style.opacity = input.type === 'text' ? '0.9' : '0.35'
}

class MostradorRegistro {
  constructor () {
    this.form     = document.getElementById('mostradorRegistroForm')
    this.nombre   = document.getElementById('mrNombre')
    this.empId    = document.getElementById('mrEmpleadoId')
    this.correo   = document.getElementById('mrCorreo')
    this.password = document.getElementById('mrPassword')
    this.mensaje  = document.getElementById('mrMensaje')
    this.form.addEventListener('submit', (e) => this.registrar(e))
  }

  mostrarMensaje (texto, ok = false) {
    this.mensaje.textContent = texto
    this.mensaje.className = 'mr-mensaje' + (ok ? ' ok' : '')
  }

  validar () {
    if (!this.nombre.value.trim() || !this.empId.value.trim() ||
        !this.correo.value.trim() || !this.password.value.trim()) {
      this.mostrarMensaje('Completa todos los campos'); return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo.value.trim())) {
      this.mostrarMensaje('Ingresa un correo válido'); return false
    }
    if (this.password.value.trim().length < 6) {
      this.mostrarMensaje('La contraseña debe tener al menos 6 caracteres'); return false
    }
    return true
  }

  async registrar (e) {
    e.preventDefault()
    if (!this.validar()) return
    this.mostrarMensaje('Registrando administrador...')
    try {
      // Registramos con rol mostrador — el backend lo asigna como 'mostrador'
      // El empleadoId se guarda como parte del nombre para identificación
      await API.Usuarios.registro(
        `${this.nombre.value.trim()} [${this.empId.value.trim()}]`,
        this.correo.value.trim(),
        this.password.value.trim(),
        this.empId.value.trim()
      )
      localStorage.setItem('sesionMostrador', 'activa')
      this.mostrarMensaje('Administrador registrado. Entrando al panel...', true)
      setTimeout(() => { window.location.href = 'mostrador.html' }, 1100)
    } catch (err) {
      this.mostrarMensaje(err.message || 'Error al registrar')
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new MostradorRegistro())
