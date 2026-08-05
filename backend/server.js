const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
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

// Conexión a SQLite
const dbPath = path.join(__dirname, 'danzas.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('✓ Conectado a SQLite en:', dbPath);
    // Migración: asegurar columna "estado" en comentarios (moderación)
    db.all("PRAGMA table_info(comentarios)", (pragmaErr, columnas) => {
      if (pragmaErr) return;
      const cols = Array.isArray(columnas) ? columnas : [];
      if (!cols.some(c => c.name === 'estado')) {
        db.run("ALTER TABLE comentarios ADD COLUMN estado TEXT NOT NULL DEFAULT 'aprobado'", (alterErr) => {
          if (alterErr) {
            console.error('Error al migrar tabla comentarios:', alterErr.message);
          } else {
            console.log('✓ Columna "estado" agregada a comentarios (migración)');
          }
        });
      }
    });
  }
});

// Promisificar las operaciones de base de datos
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

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

// ============= RUTAS =============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== DANZAS =====

// GET /api/danzas - Listar todas las danzas (ordenadas alfabéticamente)
app.get('/api/danzas', async (req, res) => {
  try {
    const danzas = await dbAll('SELECT * FROM danzas ORDER BY nombre COLLATE NOCASE ASC');
    res.json({ success: true, data: danzas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/danzas/:id - Obtener una danza específica
app.get('/api/danzas/:id', async (req, res) => {
  try {
    const danza = await dbGet('SELECT * FROM danzas WHERE id = ?', [req.params.id]);
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
    const { nombre, region, historia, coreografia, video_url } = req.body;
    
    // Validaciones
    if (!nombre || !region) {
      return res.status(400).json({ success: false, error: 'Nombre y región son obligatorios' });
    }
    
    const result = await dbRun(
      'INSERT INTO danzas (nombre, region, historia, coreografia, video_url) VALUES (?, ?, ?, ?, ?)',
      [nombre, region, historia || '', coreografia || '', video_url || '']
    );
    
    res.status(201).json({ 
      success: true, 
      data: { id: result.lastID, nombre, region, historia, coreografia, video_url }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/danzas/:id - Editar una danza existente (solo para admin)
app.put('/api/danzas/:id', requireAdminKey, async (req, res) => {
  try {
    const { nombre, region, historia, coreografia, video_url } = req.body;

    // Validaciones
    if (!nombre || !region) {
      return res.status(400).json({ success: false, error: 'Nombre y región son obligatorios' });
    }

    const existente = await dbGet('SELECT * FROM danzas WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Danza no encontrada' });
    }

    await dbRun(
      'UPDATE danzas SET nombre = ?, region = ?, historia = ?, coreografia = ?, video_url = ? WHERE id = ?',
      [nombre, region, historia || '', coreografia || '', video_url || '', req.params.id]
    );

    res.json({
      success: true,
      data: { id: Number(req.params.id), nombre, region, historia, coreografia, video_url }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/danzas/:id - Eliminar una danza (solo para admin)
app.delete('/api/danzas/:id', requireAdminKey, async (req, res) => {
  try {
    const existente = await dbGet('SELECT * FROM danzas WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Danza no encontrada' });
    }

    await dbRun('DELETE FROM danzas WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== EVENTOS =====

// GET /api/eventos - Listar todos los eventos
app.get('/api/eventos', async (req, res) => {
  try {
    const eventos = await dbAll('SELECT * FROM eventos ORDER BY fecha DESC');
    res.json({ success: true, data: eventos });
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
    
    const result = await dbRun(
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

    const existente = await dbGet('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' });
    }

    await dbRun(
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
    const existente = await dbGet('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' });
    }

    await dbRun('DELETE FROM eventos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== COMENTARIOS =====

// GET /api/comentarios - Listar comentarios aprobados (público, últimos 50)
app.get('/api/comentarios', async (req, res) => {
  try {
    const comentarios = await dbAll(
      "SELECT * FROM comentarios WHERE estado = 'aprobado' ORDER BY fecha DESC LIMIT 50"
    );
    res.json({ success: true, data: comentarios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/comentarios/pendientes - Comentarios esperando moderación (solo admin)
app.get('/api/comentarios/pendientes', requireAdminKey, async (req, res) => {
  try {
    const comentarios = await dbAll(
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
    const comentarios = await dbAll(
      "SELECT * FROM comentarios WHERE estado = 'rechazado' ORDER BY fecha DESC LIMIT 50"
    );
    res.json({ success: true, data: comentarios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/comentarios/aprobados - Comentarios publicados (solo admin, para moderar o eliminar)
app.get('/api/comentarios/aprobados', requireAdminKey, async (req, res) => {
  try {
    const comentarios = await dbAll(
      "SELECT * FROM comentarios WHERE estado = 'aprobado' ORDER BY fecha DESC LIMIT 100"
    );
    res.json({ success: true, data: comentarios });
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

    const existente = await dbGet('SELECT * FROM comentarios WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }

    await dbRun('UPDATE comentarios SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id), estado } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/comentarios/:id - Eliminar un comentario (solo admin)
app.delete('/api/comentarios/:id', requireAdminKey, async (req, res) => {
  try {
    const existente = await dbGet('SELECT * FROM comentarios WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }

    await dbRun('DELETE FROM comentarios WHERE id = ?', [req.params.id]);
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
    const result = await dbRun(
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

app.listen(PORT, () => {
  console.log(`🎭 Servidor de Danzas Folklóricas escuchando en puerto ${PORT}`);
  console.log(`📡 Base de datos: ${dbPath}`);
  console.log(`🔗 Endpoints disponibles:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET    /api/danzas`);
  console.log(`   POST   /api/danzas        🔒 admin`);
  console.log(`   PUT    /api/danzas/:id    🔒 admin`);
  console.log(`   DELETE /api/danzas/:id    🔒 admin`);
  console.log(`   GET    /api/eventos`);
  console.log(`   POST   /api/eventos       🔒 admin`);
  console.log(`   PUT    /api/eventos/:id   🔒 admin`);
  console.log(`   DELETE /api/eventos/:id   🔒 admin`);
  console.log(`   GET    /api/comentarios`);
  console.log(`   GET    /api/comentarios/pendientes  🔒 admin`);
  console.log(`   GET    /api/comentarios/rechazados  🔒 admin`);
  console.log(`   GET    /api/comentarios/aprobados   🔒 admin`);
  console.log(`   PUT    /api/comentarios/:id/estado  🔒 admin`);
  console.log(`   DELETE /api/comentarios/:id         🔒 admin`);
  console.log(`   POST   /api/comentarios`);
});

module.exports = app;
