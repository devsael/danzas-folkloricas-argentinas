const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const ddl = require('./ddl');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Clave de administrador. En producción definila en una variable de entorno ADMIN_KEY.
const ADMIN_KEY = process.env.ADMIN_KEY || 'danzas-admin-dev-key-2025';
if (!process.env.ADMIN_KEY) {
  console.warn('⚠️  ADMIN_KEY no definida. Usando clave de desarrollo. Definila en .env o en la variable de entorno del servidor.');
}

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8000', 'http://127.0.0.1:8000', 'https://devsael.github.io'],
  credentials: true
}));
app.use(bodyParser.json());

// ============= MIGRACIONES =============

// Asegura que una columna exista (funciona con SQLite y PostgreSQL)
async function ensureColumn(table, column, definition) {
  if (db.isPostgres) {
    await db.run(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
  } else {
    const columns = await db.all(`PRAGMA table_info(${table})`);
    if (!columns.some(c => c.name === column)) {
      await db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`✓ Columna "${column}" agregada a ${table}`);
    }
  }
}

// ============= AUTENTICACIÓN =============

// Middleware: exige la clave de administrador (header X-API-Key o Authorization: Bearer <clave>)
function requireAdminKey(req, res, next) {
  const header = req.headers['x-api-key'] || req.headers['authorization'] || '';
  const key = header.startsWith('Bearer ') ? header.slice(7) : header;

  if (!key || key !== ADMIN_KEY) {
    return res.status(401).json({ success: false, error: 'No autorizado: se requiere la clave de administrador' });
  }
  next();
}

// ============= UTILIDADES =============

function getPagination(req, defLimit = 10, maxLimit = 50) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit, 10) || defLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function paginacionRespuesta(total, page, limit) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

// ============= RUTAS =============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== DANZAS =====

// GET /api/danzas - Listar danzas con paginación y búsqueda opcional
//   ?search=termino&page=1&limit=12
app.get('/api/danzas', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const { page, limit, offset } = getPagination(req, 12, 50);

    const op = db.isPostgres ? 'ILIKE' : 'LIKE';
    const where = search ? `WHERE nombre ${op} ?` : '';
    const params = search ? [`%${search}%`] : [];

    const countRow = await db.get(`SELECT COUNT(*) AS total FROM danzas ${where}`, params);
    const total = countRow ? countRow.total : 0;

    const danzas = await db.all(
      `SELECT * FROM danzas ${where} ORDER BY lower(nombre) ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: danzas,
      pagination: paginacionRespuesta(total, page, limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/danzas/:id - Obtener una danza específica
app.get('/api/danzas/:id', async (req, res) => {
  try {
    const danza = await db.get('SELECT * FROM danzas WHERE id = ?', [req.params.id]);
    if (!danza) {
      return res.status(404).json({ success: false, error: 'Danza no encontrada' });
    }
    res.json({ success: true, data: danza });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/danzas - Crear una nueva danza (solo para admin)
app.post('/api/danzas', requireAdminKey, async (req, res) => {
  try {
    const { nombre, region, caracter, historia, coreografia, video_url } = req.body;
    
    // Validaciones
    if (!nombre || !region) {
      return res.status(400).json({ success: false, error: 'Nombre y región son obligatorios' });
    }
    
    const result = await db.run(
      'INSERT INTO danzas (nombre, region, caracter, historia, coreografia, video_url) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, region, caracter || 'festiva', historia || '', coreografia || '', video_url || '']
    );
    
    res.status(201).json({ 
      success: true, 
      data: { id: result.lastID, nombre, region, caracter: caracter || 'festiva', historia, coreografia, video_url }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/danzas/:id - Editar una danza existente (solo para admin)
app.put('/api/danzas/:id', requireAdminKey, async (req, res) => {
  try {
    const { nombre, region, caracter, historia, coreografia, video_url } = req.body;

    // Validaciones
    if (!nombre || !region) {
      return res.status(400).json({ success: false, error: 'Nombre y región son obligatorios' });
    }

    const existente = await db.get('SELECT * FROM danzas WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Danza no encontrada' });
    }

    await db.run(
      'UPDATE danzas SET nombre = ?, region = ?, caracter = ?, historia = ?, coreografia = ?, video_url = ? WHERE id = ?',
      [nombre, region, caracter || 'festiva', historia || '', coreografia || '', video_url || '', req.params.id]
    );

    res.json({
      success: true,
      data: { id: Number(req.params.id), nombre, region, caracter: caracter || 'festiva', historia, coreografia, video_url }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/danzas/:id - Eliminar una danza (solo para admin)
app.delete('/api/danzas/:id', requireAdminKey, async (req, res) => {
  try {
    const existente = await db.get('SELECT * FROM danzas WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Danza no encontrada' });
    }

    await db.run('DELETE FROM danzas WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== EVENTOS =====

// GET /api/eventos - Listar eventos con paginación
//   ?page=1&limit=6
app.get('/api/eventos', async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req, 6, 50);

    const countRow = await db.get('SELECT COUNT(*) AS total FROM eventos');
    const total = countRow ? countRow.total : 0;

    const eventos = await db.all(
      'SELECT * FROM eventos ORDER BY fecha DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json({
      success: true,
      data: eventos,
      pagination: paginacionRespuesta(total, page, limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/eventos - Crear un nuevo evento (solo para admin)
app.post('/api/eventos', requireAdminKey, async (req, res) => {
  try {
    const { titulo, fecha, lugar, descripcion } = req.body;
    
    // Validaciones
    if (!titulo || !fecha) {
      return res.status(400).json({ success: false, error: 'Título y fecha son obligatorios' });
    }
    
    // Validar formato de fecha (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ success: false, error: 'Formato de fecha incorrecto (use YYYY-MM-DD)' });
    }
    
    const result = await db.run(
      'INSERT INTO eventos (titulo, fecha, lugar, descripcion) VALUES (?, ?, ?, ?)',
      [titulo, fecha, lugar || '', descripcion || '']
    );
    
    res.status(201).json({ 
      success: true, 
      data: { id: result.lastID, titulo, fecha, lugar, descripcion }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/eventos/:id - Editar un evento existente (solo para admin)
app.put('/api/eventos/:id', requireAdminKey, async (req, res) => {
  try {
    const { titulo, fecha, lugar, descripcion } = req.body;

    // Validaciones
    if (!titulo || !fecha) {
      return res.status(400).json({ success: false, error: 'Título y fecha son obligatorios' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ success: false, error: 'Formato de fecha incorrecto (use YYYY-MM-DD)' });
    }

    const existente = await db.get('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' });
    }

    await db.run(
      'UPDATE eventos SET titulo = ?, fecha = ?, lugar = ?, descripcion = ? WHERE id = ?',
      [titulo, fecha, lugar || '', descripcion || '', req.params.id]
    );

    res.json({
      success: true,
      data: { id: Number(req.params.id), titulo, fecha, lugar, descripcion }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/eventos/:id - Eliminar un evento (solo para admin)
app.delete('/api/eventos/:id', requireAdminKey, async (req, res) => {
  try {
    const existente = await db.get('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' });
    }

    await db.run('DELETE FROM eventos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== COMENTARIOS =====

// GET /api/comentarios - Comentarios aprobados (público) con paginación
//   ?page=1&limit=10
app.get('/api/comentarios', async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req, 10, 50);

    const countRow = await db.get("SELECT COUNT(*) AS total FROM comentarios WHERE estado = 'aprobado'");
    const total = countRow ? countRow.total : 0;

    const comentarios = await db.all(
      "SELECT * FROM comentarios WHERE estado = 'aprobado' ORDER BY fecha DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    res.json({
      success: true,
      data: comentarios,
      pagination: paginacionRespuesta(total, page, limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/comentarios/pendientes - Comentarios esperando moderación (solo admin)
app.get('/api/comentarios/pendientes', requireAdminKey, async (req, res) => {
  try {
    const comentarios = await db.all(
      "SELECT * FROM comentarios WHERE estado = 'pendiente' ORDER BY fecha ASC"
    );
    res.json({ success: true, data: comentarios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/comentarios/rechazados - Comentarios rechazados (solo admin)
app.get('/api/comentarios/rechazados', requireAdminKey, async (req, res) => {
  try {
    const comentarios = await db.all(
      "SELECT * FROM comentarios WHERE estado = 'rechazado' ORDER BY fecha DESC LIMIT 50"
    );
    res.json({ success: true, data: comentarios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/comentarios/aprobados - Comentarios publicados (solo admin)
app.get('/api/comentarios/aprobados', requireAdminKey, async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req, 10, 100);
    const countRow = await db.get("SELECT COUNT(*) AS total FROM comentarios WHERE estado = 'aprobado'");
    const total = countRow ? countRow.total : 0;

    const comentarios = await db.all(
      "SELECT * FROM comentarios WHERE estado = 'aprobado' ORDER BY fecha DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    res.json({
      success: true,
      data: comentarios,
      pagination: paginacionRespuesta(total, page, limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/comentarios/:id/estado - Aprobar o rechazar un comentario (solo admin)
app.put('/api/comentarios/:id/estado', requireAdminKey, async (req, res) => {
  try {
    const { estado } = req.body;

    if (!['aprobado', 'rechazado'].includes(estado)) {
      return res.status(400).json({ success: false, error: "Estado inválido (use 'aprobado' o 'rechazado')" });
    }

    const existente = await db.get('SELECT * FROM comentarios WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }

    await db.run('UPDATE comentarios SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id), estado } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/comentarios/:id - Eliminar un comentario (solo admin)
app.delete('/api/comentarios/:id', requireAdminKey, async (req, res) => {
  try {
    const existente = await db.get('SELECT * FROM comentarios WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }

    await db.run('DELETE FROM comentarios WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/comentarios - Crear un nuevo comentario (queda pendiente de moderación)
app.post('/api/comentarios', async (req, res) => {
  try {
    const { nombre, mensaje } = req.body;
    
    // Validaciones
    if (!nombre || !mensaje) {
      return res.status(400).json({ success: false, error: 'Nombre y mensaje son obligatorios' });
    }
    
    if (nombre.length < 2 || nombre.length > 100) {
      return res.status(400).json({ success: false, error: 'El nombre debe tener entre 2 y 100 caracteres' });
    }
    
    if (mensaje.length < 5 || mensaje.length > 1000) {
      return res.status(400).json({ success: false, error: 'El mensaje debe tener entre 5 y 1000 caracteres' });
    }
    
    const fecha = new Date().toISOString();
    const estado = 'pendiente';
    const result = await db.run(
      'INSERT INTO comentarios (nombre, mensaje, fecha, estado) VALUES (?, ?, ?, ?)',
      [nombre, mensaje, fecha, estado]
    );
    
    res.status(201).json({ 
      success: true, 
      data: { id: result.lastID, nombre, mensaje, fecha, estado }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ERRORES =====

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint no encontrado' });
});

// Error handler general
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

// ===== INICIO DEL SERVIDOR =====

async function iniciar() {
  try {
    // Auto-crear tablas si no existen (necesario en un PostgreSQL recién creado)
    await db.run(ddl.danzas);
    await db.run(ddl.eventos);
    await db.run(ddl.comentarios);

    await ensureColumn('comentarios', 'estado', "TEXT NOT NULL DEFAULT 'aprobado'");
    await ensureColumn('danzas', 'caracter', "TEXT DEFAULT 'festiva'");
    console.log('✓ Migraciones aplicadas');
  } catch (err) {
    console.error('Error en migraciones:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🎭 Servidor de Danzas Folklóricas escuchando en puerto ${PORT}`);
    console.log(`🗄️  Base de datos: ${db.isPostgres ? 'PostgreSQL (Render)' : 'SQLite local'}`);
    console.log(`🔗 Endpoints disponibles:`);
    console.log(`   GET    /api/health`);
    console.log(`   GET    /api/danzas?search=&page=&limit=`);
    console.log(`   POST   /api/danzas        🔒 admin`);
    console.log(`   PUT    /api/danzas/:id    🔒 admin`);
    console.log(`   DELETE /api/danzas/:id    🔒 admin`);
    console.log(`   GET    /api/eventos?page=&limit=`);
    console.log(`   POST   /api/eventos       🔒 admin`);
    console.log(`   PUT    /api/eventos/:id   🔒 admin`);
    console.log(`   DELETE /api/eventos/:id   🔒 admin`);
    console.log(`   GET    /api/comentarios?page=&limit=`);
    console.log(`   GET    /api/comentarios/pendientes  🔒 admin`);
    console.log(`   GET    /api/comentarios/rechazados  🔒 admin`);
    console.log(`   GET    /api/comentarios/aprobados   🔒 admin`);
    console.log(`   PUT    /api/comentarios/:id/estado  🔒 admin`);
    console.log(`   DELETE /api/comentarios/:id         🔒 admin`);
    console.log(`   POST   /api/comentarios`);
  });
}

iniciar();

module.exports = app;
