const { Pool } = require('pg')

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  user:     process.env.DB_USER     || 'comalas_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'comalas',
})

pool.on('connect', () => {
  console.log('[DB] Conectado a PostgreSQL')
})

pool.on('error', (err) => {
  console.error('[DB] Error en conexión:', err.message)
})

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
}
