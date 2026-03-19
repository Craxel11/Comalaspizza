-- ═══════════════════════════════════════════
--  COMALAS — Inicialización de base de datos
-- ═══════════════════════════════════════════

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  usuario     VARCHAR(100) UNIQUE NOT NULL,  -- correo o teléfono
  password    VARCHAR(255) NOT NULL,          -- bcrypt hash
  telefono    VARCHAR(20),
  direccion   TEXT,
  latitud     DECIMAL(9,6),
  longitud    DECIMAL(9,6),
  rol         VARCHAR(20) DEFAULT 'cliente',  -- cliente | mostrador
  creado_en   TIMESTAMP DEFAULT NOW()
);

-- Tabla del menú (productos)
CREATE TABLE IF NOT EXISTS productos (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  descripcion TEXT,
  categoria   VARCHAR(50),                    -- pizza | bebida | extra
  precio_base DECIMAL(8,2) NOT NULL,
  disponible  BOOLEAN DEFAULT TRUE,
  imagen_url  VARCHAR(255),
  creado_en   TIMESTAMP DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id               SERIAL PRIMARY KEY,
  usuario_id       INTEGER REFERENCES usuarios(id),
  cliente_nombre   VARCHAR(100),
  telefono         VARCHAR(20),
  direccion        TEXT,
  latitud          DECIMAL(9,6),
  longitud         DECIMAL(9,6),
  subtotal         DECIMAL(8,2),
  total            DECIMAL(8,2),
  estado           VARCHAR(30) DEFAULT 'Nuevo',
  tiempo_estimado  VARCHAR(50) DEFAULT '30 a 35 minutos',
  fecha_creado     TIMESTAMP DEFAULT NOW(),
  fecha_actualizado TIMESTAMP DEFAULT NOW()
);

-- Estado puede ser: Nuevo | En preparación | En camino | Entregado

-- Tabla de items dentro de un pedido
CREATE TABLE IF NOT EXISTS pedido_items (
  id          SERIAL PRIMARY KEY,
  pedido_id   INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  nombre      VARCHAR(200) NOT NULL,
  precio      DECIMAL(8,2) NOT NULL,
  cantidad    INTEGER DEFAULT 1
);

-- Datos de ejemplo del menú
INSERT INTO productos (nombre, descripcion, categoria, precio_base) VALUES
  ('Pizza Pepperoni',   'Pepperoni y queso mozzarella',     'pizza',  99),
  ('Pizza Hawaiana',    'Jamon, pina y queso',              'pizza',  99),
  ('Pizza Mexicana',    'Chorizo, jalapeño y chile',        'pizza', 109),
  ('Pizza Vegetariana', 'Verduras mixtas y queso',          'pizza',  99),
  ('Coca-Cola 600ml',   'Refresco',                         'bebida', 30),
  ('Pepsi 600ml',       'Refresco',                         'bebida', 30),
  ('Papas Fritas',      'Porcion mediana',                  'extra',  45),
  ('Nuggets x8',        'Nuggets de pollo con salsa',       'extra',  55)
ON CONFLICT DO NOTHING;
