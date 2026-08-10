const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const ddl = require('./ddl');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Render usa un proxy: confiamos en el header X-Forwarded-For para que req.ip
// sea la IP real del visitante (necesario para el rate limiting).
app.set('trust proxy', 1);

// Clave de administrador. En producción definila en una variable de entorno ADMIN_KEY.
// Si falta en producción, no arranca: así no quedamos con la clave de desarrollo pública.
const esProduccion = process.env.NODE_ENV === 'production';
const ADMIN_KEY = process.env.ADMIN_KEY || 'danzas-admin-dev-key-2025';

if (!process.env.ADMIN_KEY && esProduccion) {
  console.error('🚨 ADMIN_KEY no está definida. El servidor no arranca en producción sin la clave de administrador.');
  console.error('   Configurala en Render → Environment → ADMIN_KEY.');
  process.exit(1);
}

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

// Escapa caracteres comodín de LIKE (%, _) para que la búsqueda los trate literal
function escapeLike(s) {
  return String(s).replace(/[\\%_]/g, (m) => `\\${m}`);
}

// Valida que :id sea un número entero
function validarId(req, res, next) {
  if (!/^\d+$/.test(req.params.id || '')) {
    return res.status(400).json({ success: false, error: 'El id debe ser un número entero' });
  }
  next();
}

// Devuelve error genérico al cliente y loguea el detalle en el servidor
function handleError(res, error, req) {
  console.error(`[${new Date().toISOString()}] Error en ${req.method} ${req.originalUrl}:`, error.message);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
}

// Rate limiting simple en memoria (sin dependencias).
// Limita la cantidad de requests por IP por ventana de tiempo.
const rateHits = new Map();

function rateLimit(max, ventanaMs) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ahora = Date.now();
    let datos = rateHits.get(ip);

    if (!datos || ahora > datos.resetsAt) {
      datos = { count: 0, resetsAt: ahora + ventanaMs };
    }

    datos.count += 1;
    rateHits.set(ip, datos);

    if (rateHits.size > 10000) {
      rateHits.clear();
    }

    if (datos.count > max) {
      return res.status(429).json({ success: false, error: 'Demasiadas solicitudes. Esperá un momento y volvé a intentar.' });
    }
    next();
  };
}

// ============= RUTAS =============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POSICIONES válidas para la imagen de una danza (se usa con object-position)
const POSICIONES_IMAGEN = [
  'left top', 'center top', 'right top',
  'left center', 'center center', 'right center',
  'left bottom', 'center bottom', 'right bottom'
];

function posicionImagenValida(valor) {
  return POSICIONES_IMAGEN.includes(valor) ? valor : 'center center';
}

// ===== DANZAS =====

// GET /api/danzas - Listar danzas con paginación y búsqueda opcional
//   ?search=termino&page=1&limit=12
app.get('/api/danzas', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const { page, limit, offset } = getPagination(req, 12, 50);

    const op = db.isPostgres ? 'ILIKE' : 'LIKE';
    const where = search ? `WHERE nombre ${op} ? ESCAPE '\\'` : '';
    const params = search ? [`%${escapeLike(search)}%`] : [];

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
    return handleError(res, error, req);
  }
});

// GET /api/danzas/:id - Obtener una danza específica
app.get('/api/danzas/:id', validarId, async (req, res) => {
  try {
    const danza = await db.get('SELECT * FROM danzas WHERE id = ?', [req.params.id]);
    if (!danza) {
      return res.status(404).json({ success: false, error: 'Danza no encontrada' });
    }
    res.json({ success: true, data: danza });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// POST /api/danzas - Crear una nueva danza (solo para admin)
app.post('/api/danzas', requireAdminKey, async (req, res) => {
  try {
    const { nombre, region, caracter, historia, coreografia, video_url, imagen_url, imagen_posicion } = req.body;
    
    // Validaciones
    if (!nombre || !region) {
      return res.status(400).json({ success: false, error: 'Nombre y región son obligatorios' });
    }
    
    const result = await db.run(
      'INSERT INTO danzas (nombre, region, caracter, historia, coreografia, video_url, imagen_url, imagen_posicion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, region, caracter || 'festiva', historia || '', coreografia || '', video_url || '', imagen_url || '', posicionImagenValida(imagen_posicion)]
    );
    
    res.status(201).json({ 
      success: true, 
      data: { id: result.lastID, nombre, region, caracter: caracter || 'festiva', historia, coreografia, video_url, imagen_url, imagen_posicion: posicionImagenValida(imagen_posicion) }
    });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// PUT /api/danzas/:id - Editar una danza existente (solo para admin)
app.put('/api/danzas/:id', requireAdminKey, validarId, async (req, res) => {
  try {
    const { nombre, region, caracter, historia, coreografia, video_url, imagen_url, imagen_posicion } = req.body;

    // Validaciones
    if (!nombre || !region) {
      return res.status(400).json({ success: false, error: 'Nombre y región son obligatorios' });
    }

    const existente = await db.get('SELECT * FROM danzas WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Danza no encontrada' });
    }

    await db.run(
      'UPDATE danzas SET nombre = ?, region = ?, caracter = ?, historia = ?, coreografia = ?, video_url = ?, imagen_url = ?, imagen_posicion = ? WHERE id = ?',
      [nombre, region, caracter || 'festiva', historia || '', coreografia || '', video_url || '', imagen_url || '', posicionImagenValida(imagen_posicion), req.params.id]
    );

    res.json({
      success: true,
      data: { id: Number(req.params.id), nombre, region, caracter: caracter || 'festiva', historia, coreografia, video_url, imagen_url, imagen_posicion: posicionImagenValida(imagen_posicion) }
    });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// DELETE /api/danzas/:id - Eliminar una danza (solo para admin)
app.delete('/api/danzas/:id', requireAdminKey, validarId, async (req, res) => {
  try {
    const existente = await db.get('SELECT * FROM danzas WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Danza no encontrada' });
    }

    await db.run('DELETE FROM danzas WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (error) {
    return handleError(res, error, req);
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
    return handleError(res, error, req);
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
    return handleError(res, error, req);
  }
});

// PUT /api/eventos/:id - Editar un evento existente (solo para admin)
app.put('/api/eventos/:id', requireAdminKey, validarId, async (req, res) => {
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
    return handleError(res, error, req);
  }
});

// DELETE /api/eventos/:id - Eliminar un evento (solo para admin)
app.delete('/api/eventos/:id', requireAdminKey, validarId, async (req, res) => {
  try {
    const existente = await db.get('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' });
    }

    await db.run('DELETE FROM eventos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// ===== CURSOS (premium) =====

const crypto = require('crypto');

function generarCodigoAcceso() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[crypto.randomInt(chars.length)];
  return 'DFA-' + s.slice(0, 4) + '-' + s.slice(4);
}

// GET /api/cursos - Listar cursos (solo admin; incluye los enlaces de Drive)
app.get('/api/cursos', requireAdminKey, async (req, res) => {
  try {
    const cursos = await db.all('SELECT * FROM cursos ORDER BY nombre ASC');
    res.json({ success: true, data: cursos });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// POST /api/cursos - Crear un curso (solo admin)
app.post('/api/cursos', requireAdminKey, async (req, res) => {
  try {
    const { nombre, descripcion, drive_url } = req.body;

    if (!nombre || !drive_url) {
      return res.status(400).json({ success: false, error: 'Nombre y enlace de Drive son obligatorios' });
    }

    const result = await db.run(
      'INSERT INTO cursos (nombre, descripcion, drive_url) VALUES (?, ?, ?)',
      [nombre, descripcion || '', drive_url]
    );

    res.status(201).json({
      success: true,
      data: { id: result.lastID, nombre, descripcion, drive_url }
    });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// PUT /api/cursos/:id - Editar un curso (solo admin)
app.put('/api/cursos/:id', requireAdminKey, validarId, async (req, res) => {
  try {
    const { nombre, descripcion, drive_url } = req.body;

    if (!nombre || !drive_url) {
      return res.status(400).json({ success: false, error: 'Nombre y enlace de Drive son obligatorios' });
    }

    const existente = await db.get('SELECT * FROM cursos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Curso no encontrado' });
    }

    await db.run(
      'UPDATE cursos SET nombre = ?, descripcion = ?, drive_url = ? WHERE id = ?',
      [nombre, descripcion || '', drive_url, req.params.id]
    );

    res.json({ success: true, data: { id: Number(req.params.id), nombre, descripcion, drive_url } });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// DELETE /api/cursos/:id - Eliminar un curso y sus códigos (solo admin)
app.delete('/api/cursos/:id', requireAdminKey, validarId, async (req, res) => {
  try {
    const existente = await db.get('SELECT * FROM cursos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Curso no encontrado' });
    }

    await db.run('DELETE FROM codigos WHERE curso_id = ?', [req.params.id]);
    await db.run('DELETE FROM cursos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// ===== CÓDIGOS DE ACCESO (premium) =====

// GET /api/codigos - Listar códigos con el curso asignado (solo admin)
app.get('/api/codigos', requireAdminKey, async (req, res) => {
  try {
    const codigos = await db.all(`
      SELECT c.id, c.codigo, c.estado, c.nombre_cliente, c.usado, c.creado,
             cu.nombre AS curso_nombre
      FROM codigos c LEFT JOIN cursos cu ON c.curso_id = cu.id
      ORDER BY c.id DESC
    `);
    res.json({ success: true, data: codigos });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// POST /api/codigos - Generar un código para un curso (solo admin)
app.post('/api/codigos', requireAdminKey, async (req, res) => {
  try {
    const { curso_id, nombre_cliente } = req.body;

    if (!curso_id) {
      return res.status(400).json({ success: false, error: 'Debés elegir un curso' });
    }

    const curso = await db.get('SELECT * FROM cursos WHERE id = ?', [curso_id]);
    if (!curso) {
      return res.status(404).json({ success: false, error: 'Curso no encontrado' });
    }

    const codigo = generarCodigoAcceso();
    await db.run(
      'INSERT INTO codigos (codigo, curso_id, estado, nombre_cliente) VALUES (?, ?, ?, ?)',
      [codigo, curso_id, 'activo', nombre_cliente || '']
    );

    res.status(201).json({
      success: true,
      data: { codigo, curso_id: Number(curso_id), nombre_cliente: nombre_cliente || '' }
    });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// DELETE /api/codigos/:id - Revocar/eliminar un código (solo admin)
app.delete('/api/codigos/:id', requireAdminKey, validarId, async (req, res) => {
  try {
    const existente = await db.get('SELECT * FROM codigos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Código no encontrado' });
    }

    await db.run('DELETE FROM codigos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// ===== MIS CURSOS (público: entrega el enlace solo con un código válido) =====

// POST /api/mis-cursos - El visitante ingresa su código y recibe el curso
app.post('/api/mis-cursos', rateLimit(10, 60000), async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo || !codigo.trim()) {
      return res.status(400).json({ success: false, error: 'Ingresá tu código de acceso' });
    }

    const registro = await db.get('SELECT * FROM codigos WHERE codigo = ?', [codigo.trim()]);
    if (!registro) {
      return res.status(404).json({ success: false, error: 'Código inválido. Verificá que esté bien escrito.' });
    }

    if (registro.estado !== 'activo') {
      return res.status(403).json({ success: false, error: 'Este código ya no está activo.' });
    }

    const curso = await db.get('SELECT * FROM cursos WHERE id = ?', [registro.curso_id]);
    if (!curso) {
      return res.status(404).json({ success: false, error: 'El curso asociado a este código ya no existe.' });
    }

    await db.run('UPDATE codigos SET usado = ? WHERE id = ?', [new Date().toISOString(), registro.id]);

    res.json({
      success: true,
      data: {
        curso: {
          nombre: curso.nombre,
          descripcion: curso.descripcion,
          drive_url: curso.drive_url
        }
      }
    });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// ===== CONFIGURACIÓN (portada y botón de la portada) =====

// GET /api/config - Configuración pública (imagen de portada, botón de descarga)
app.get('/api/config', async (req, res) => {
  try {
    const filas = await db.all('SELECT clave, valor FROM config');
    const config = {};
    filas.forEach(f => { config[f.clave] = f.valor; });

    res.json({
      success: true,
      data: {
        hero_background_url: config.hero_background_url || '',
        hero_boton_drive_url: config.hero_boton_drive_url || '',
        hero_boton_drive_texto: config.hero_boton_drive_texto || '📘 Descargar Curso'
      }
    });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// PUT /api/config - Actualizar configuración (solo admin)
app.put('/api/config', requireAdminKey, async (req, res) => {
  try {
    const campos = ['hero_background_url', 'hero_boton_drive_url', 'hero_boton_drive_texto'];
    const recibidos = Object.keys(req.body || {});
    const validos = recibidos.filter(c => campos.includes(c));

    if (validos.length === 0) {
      return res.status(400).json({ success: false, error: 'No se recibió ningún campo válido para guardar' });
    }

    for (const campo of validos) {
      const valor = typeof req.body[campo] === 'string' ? req.body[campo].trim() : '';
      await db.run(
        'INSERT INTO config (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor',
        [campo, valor],
        { returning: false }
      );
    }

    const config = await db.get('SELECT valor FROM config WHERE clave = ?', [validos[0]]);
    res.json({ success: true, data: { campo: validos[0], valor: config ? config.valor : '' } });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// ===== RECURSOS (material gratis: cursos, libros, galerías) =====

// GET /api/recursos - Listar recursos públicos (libros, galerías, material libre)
app.get('/api/recursos', async (req, res) => {
  try {
    const recursos = await db.all(
      "SELECT * FROM recursos ORDER BY CASE categoria WHEN 'cursos' THEN 1 WHEN 'libros' THEN 2 ELSE 3 END, lower(titulo) ASC"
    );
    res.json({ success: true, data: recursos });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// POST /api/recursos - Crear un recurso (solo admin)
app.post('/api/recursos', requireAdminKey, async (req, res) => {
  try {
    const { categoria, titulo, descripcion, url } = req.body;

    if (!['cursos', 'libros', 'imagenes'].includes(categoria)) {
      return res.status(400).json({ success: false, error: 'Categoría inválida (use cursos, libros o imagenes)' });
    }
    if (!titulo || !url) {
      return res.status(400).json({ success: false, error: 'Título y enlace son obligatorios' });
    }

    const result = await db.run(
      'INSERT INTO recursos (categoria, titulo, descripcion, url) VALUES (?, ?, ?, ?)',
      [categoria, titulo, descripcion || '', url]
    );

    res.status(201).json({
      success: true,
      data: { id: result.lastID, categoria, titulo, descripcion, url }
    });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// PUT /api/recursos/:id - Editar un recurso (solo admin)
app.put('/api/recursos/:id', requireAdminKey, validarId, async (req, res) => {
  try {
    const { categoria, titulo, descripcion, url } = req.body;

    if (!['cursos', 'libros', 'imagenes'].includes(categoria)) {
      return res.status(400).json({ success: false, error: 'Categoría inválida (use cursos, libros o imagenes)' });
    }
    if (!titulo || !url) {
      return res.status(400).json({ success: false, error: 'Título y enlace son obligatorios' });
    }

    const existente = await db.get('SELECT * FROM recursos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Recurso no encontrado' });
    }

    await db.run(
      'UPDATE recursos SET categoria = ?, titulo = ?, descripcion = ?, url = ? WHERE id = ?',
      [categoria, titulo, descripcion || '', url, req.params.id]
    );

    res.json({ success: true, data: { id: Number(req.params.id), categoria, titulo, descripcion, url } });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// DELETE /api/recursos/:id - Eliminar un recurso (solo admin)
app.delete('/api/recursos/:id', requireAdminKey, validarId, async (req, res) => {
  try {
    const existente = await db.get('SELECT * FROM recursos WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Recurso no encontrado' });
    }

    await db.run('DELETE FROM recursos WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// ===== VISITAS Y ESTADÍSTICAS =====

// POST /api/visita - Suma una visita (público). Se cuenta una vez por sesión
// desde el navegador (el frontend lo evita con sessionStorage) y el rate limit
// protege contra bots.
app.post('/api/visita', rateLimit(60, 3600000), async (req, res) => {
  try {
    const actual = await db.get("SELECT valor FROM config WHERE clave = 'visitas'");
    const n = (actual && parseInt(actual.valor, 10)) || 0;
    const nuevo = n + 1;

    await db.run(
      "INSERT INTO config (clave, valor) VALUES ('visitas', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor",
      [String(nuevo)],
      { returning: false }
    );

    res.json({ success: true, data: { visitas: nuevo } });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// GET /api/estadisticas - Totales del sitio (solo admin)
app.get('/api/estadisticas', requireAdminKey, async (req, res) => {
  try {
    const [danzas, eventos, comentarios, cursos, codigos, visitas] = await Promise.all([
      db.get('SELECT COUNT(*) AS n FROM danzas'),
      db.get('SELECT COUNT(*) AS n FROM eventos'),
      db.get("SELECT COUNT(*) AS n FROM comentarios WHERE estado = 'aprobado'"),
      db.get('SELECT COUNT(*) AS n FROM cursos'),
      db.get("SELECT COUNT(*) AS n FROM codigos WHERE estado = 'activo'"),
      db.get("SELECT valor FROM config WHERE clave = 'visitas'")
    ]);

    res.json({
      success: true,
      data: {
        danzas: Number(danzas.n) || 0,
        eventos: Number(eventos.n) || 0,
        comentariosAprobados: Number(comentarios.n) || 0,
        cursos: Number(cursos.n) || 0,
        codigosActivos: Number(codigos.n) || 0,
        visitas: (visitas && parseInt(visitas.valor, 10)) || 0
      }
    });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// ===== RESPALDO (exportar / restaurar) =====

// GET /api/backup - Descarga un JSON con todos los datos (solo admin)
app.get('/api/backup', requireAdminKey, rateLimit(10, 60000), async (req, res) => {
  try {
    const [danzas, eventos, comentarios, cursos, codigos, config, recursos] = await Promise.all([
      db.all('SELECT * FROM danzas ORDER BY id ASC'),
      db.all('SELECT * FROM eventos ORDER BY id ASC'),
      db.all('SELECT * FROM comentarios ORDER BY id ASC'),
      db.all('SELECT * FROM cursos ORDER BY id ASC'),
      db.all('SELECT * FROM codigos ORDER BY id ASC'),
      db.all('SELECT * FROM config ORDER BY clave ASC'),
      db.all('SELECT * FROM recursos ORDER BY id ASC')
    ]);

    res.json({
      success: true,
      data: {
        app: 'danzas-folkloricas-argentinas',
        version: 1,
        generado: new Date().toISOString(),
        danzas, eventos, comentarios, cursos, codigos, config, recursos
      }
    });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// POST /api/restore - Reemplaza todos los datos con un respaldo (solo admin)
// Recibe el JSON completo generado por /api/backup (o su campo "data").
app.post('/api/restore', requireAdminKey, rateLimit(3, 60000), async (req, res) => {
  try {
    const body = req.body && req.body.data ? req.body.data : (req.body || {});
    const b = (tabla) => (Array.isArray(body[tabla]) ? body[tabla] : []);

    const danzasArr = b('danzas');
    if (danzasArr.length === 0 && Object.keys(body).length === 0) {
      return res.status(400).json({ success: false, error: 'No se recibió un respaldo válido' });
    }

    // Limpiar en orden seguro
    await db.run('DELETE FROM codigos');
    await db.run('DELETE FROM cursos');
    await db.run('DELETE FROM comentarios');
    await db.run('DELETE FROM eventos');
    await db.run('DELETE FROM danzas');
    await db.run('DELETE FROM config');
    await db.run('DELETE FROM recursos');

    // Reinsertar con los ids originales
    for (const d of danzasArr) {
      await db.run(
        'INSERT INTO danzas (id, nombre, region, caracter, historia, coreografia, video_url, imagen_url, imagen_posicion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [d.id, d.nombre, d.region, d.caracter || 'festiva', d.historia || null, d.coreografia || null, d.video_url || null, d.imagen_url || null, d.imagen_posicion || 'center center']
      );
    }
    for (const ev of b('eventos')) {
      await db.run(
        'INSERT INTO eventos (id, titulo, fecha, lugar, descripcion) VALUES (?, ?, ?, ?, ?)',
        [ev.id, ev.titulo, ev.fecha, ev.lugar || null, ev.descripcion || null]
      );
    }
    for (const c of b('comentarios')) {
      await db.run(
        'INSERT INTO comentarios (id, nombre, mensaje, fecha, estado) VALUES (?, ?, ?, ?, ?)',
        [c.id, c.nombre, c.mensaje, c.fecha || new Date().toISOString(), c.estado || 'aprobado']
      );
    }
    for (const cur of b('cursos')) {
      await db.run(
        'INSERT INTO cursos (id, nombre, descripcion, drive_url, creado) VALUES (?, ?, ?, ?, ?)',
        [cur.id, cur.nombre, cur.descripcion || null, cur.drive_url, cur.creado || new Date().toISOString()]
      );
    }
    for (const cod of b('codigos')) {
      await db.run(
        'INSERT INTO codigos (id, codigo, curso_id, estado, nombre_cliente, usado, creado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [cod.id, cod.codigo, cod.curso_id, cod.estado || 'activo', cod.nombre_cliente || null, cod.usado || null, cod.creado || new Date().toISOString()]
      );
    }
    for (const k of b('config')) {
      await db.run(
        'INSERT INTO config (clave, valor) VALUES (?, ?)',
        [k.clave, k.valor],
        { returning: false }
      );
    }
    for (const r of b('recursos')) {
      await db.run(
        'INSERT INTO recursos (id, categoria, titulo, descripcion, url) VALUES (?, ?, ?, ?, ?)',
        [r.id, r.categoria, r.titulo, r.descripcion || null, r.url]
      );
    }

    // Reiniciar secuencias en PostgreSQL para que los próximos inserts no colisionen
    if (db.isPostgres) {
      for (const tabla of ['danzas', 'eventos', 'comentarios', 'cursos', 'codigos', 'recursos']) {
        await db.run(`SELECT setval(pg_get_serial_sequence('${tabla}', 'id'), COALESCE((SELECT MAX(id) FROM ${tabla}), 1), true)`);
      }
    }

    res.json({
      success: true,
      data: {
        restaurados: {
          danzas: danzasArr.length,
          eventos: b('eventos').length,
          comentarios: b('comentarios').length,
          cursos: b('cursos').length,
          codigos: b('codigos').length,
          config: b('config').length,
          recursos: b('recursos').length
        }
      }
    });
  } catch (error) {
    return handleError(res, error, req);
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
    return handleError(res, error, req);
  }
});

// GET /api/comentarios/pendientes - Comentarios esperando moderación (solo admin)
app.get('/api/comentarios/pendientes', requireAdminKey, rateLimit(30, 60000), async (req, res) => {
  try {
    const comentarios = await db.all(
      "SELECT * FROM comentarios WHERE estado = 'pendiente' ORDER BY fecha ASC"
    );
    res.json({ success: true, data: comentarios });
  } catch (error) {
    return handleError(res, error, req);
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
    return handleError(res, error, req);
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
    return handleError(res, error, req);
  }
});

// PUT /api/comentarios/:id/estado - Aprobar o rechazar un comentario (solo admin)
app.put('/api/comentarios/:id/estado', requireAdminKey, validarId, async (req, res) => {
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
    return handleError(res, error, req);
  }
});

// DELETE /api/comentarios/:id - Eliminar un comentario (solo admin)
app.delete('/api/comentarios/:id', requireAdminKey, validarId, async (req, res) => {
  try {
    const existente = await db.get('SELECT * FROM comentarios WHERE id = ?', [req.params.id]);
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }

    await db.run('DELETE FROM comentarios WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (error) {
    return handleError(res, error, req);
  }
});

// POST /api/comentarios - Crear un nuevo comentario (queda pendiente de moderación)
app.post('/api/comentarios', rateLimit(5, 60000), async (req, res) => {
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
    return handleError(res, error, req);
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
    await db.run(ddl.cursos);
    await db.run(ddl.codigos);
    await db.run(ddl.config);
    await db.run(ddl.recursos);

    await ensureColumn('comentarios', 'estado', "TEXT NOT NULL DEFAULT 'aprobado'");
    await ensureColumn('danzas', 'caracter', "TEXT DEFAULT 'festiva'");
    await ensureColumn('danzas', 'imagen_url', 'TEXT');
    await ensureColumn('danzas', 'imagen_posicion', "TEXT DEFAULT 'center center'");
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
    console.log(`   GET    /api/cursos              🔒 admin`);
    console.log(`   POST   /api/cursos              🔒 admin`);
    console.log(`   PUT    /api/cursos/:id          🔒 admin`);
    console.log(`   DELETE /api/cursos/:id          🔒 admin`);
    console.log(`   GET    /api/codigos             🔒 admin`);
    console.log(`   POST   /api/codigos             🔒 admin`);
    console.log(`   DELETE /api/codigos/:id         🔒 admin`);
    console.log(`   POST   /api/mis-cursos          🔑 requiere código`);
    console.log(`   GET    /api/recursos`);
    console.log(`   POST   /api/recursos            🔒 admin`);
    console.log(`   PUT    /api/recursos/:id        🔒 admin`);
    console.log(`   DELETE /api/recursos/:id        🔒 admin`);
    console.log(`   POST   /api/visita`);
    console.log(`   GET    /api/estadisticas        🔒 admin`);
    console.log(`   GET    /api/config`);
    console.log(`   PUT    /api/config              🔒 admin`);
    console.log(`   GET    /api/backup              🔒 admin`);
    console.log(`   POST   /api/restore             🔒 admin`);
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
