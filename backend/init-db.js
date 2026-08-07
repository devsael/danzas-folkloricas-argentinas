// ============================================
// INICIALIZACIÓN DE LA BASE DE DATOS
// ============================================
// Crea las tablas y carga datos de ejemplo.
// Usa PostgreSQL si existe DATABASE_URL, si no SQLite local (danzas.db).
//
// Uso:
//   npm run init-db
//   # o con PostgreSQL:
//   DATABASE_URL=postgres://... npm run init-db
// ============================================

const db = require('./db');
const ddl = require('./ddl');

const danzas = [
  {
    nombre: 'Chacarera',
    region: 'Noroeste (Salta, Jujuy, Tucumán)',
    caracter: 'festiva',
    historia: 'Danza festiva de origen andino que representa la cosecha y la alegría. Es una danza de parejas con movimientos alegres y energéticos que celebran el trabajo en el campo.',
    coreografia: 'Movimientos circulares, giros de parejas, palmoteos rítmicos, pasos alternados. Se ejecuta en tiempo de 6/8.',
    video_url: 'https://www.youtube.com/embed/CKG_5PFQIA4'
  },
  {
    nombre: 'Cueca',
    region: 'Noroeste (compartida con Chile)',
    caracter: 'romántica',
    historia: 'Danza de cortejo entre hombre y mujer que simula el galanteo de un gallo con una gallina. Tiene movimientos elegantes y coquetos que expresan el juego amoroso.',
    coreografia: 'Movimientos de cadera, giros, juego de pañuelos, movimientos de brazos elegantes. Tiempo de 2/4 con un ritmo muy particular.',
    video_url: 'https://www.youtube.com/embed/iQWxNgL9z24'
  },
  {
    nombre: 'Zamba',
    region: 'Centro y Noroeste',
    caracter: 'romántica',
    historia: 'Danza lenta y sensual de parejas que expresa amor y elegancia. Originaria del siglo XVIII, refleja la influencia criolla y el romanticismo latinoamericano.',
    coreografia: 'Pasos deslizantes, movimientos suaves de caderas, brazos serpenteantes, uso de pañuelos. Ritmo 6/8 muy lento y expresivo.',
    video_url: 'https://www.youtube.com/embed/k5qJFTNcyO8'
  },
  {
    nombre: 'Tango',
    region: 'Buenos Aires y Río de la Plata',
    caracter: 'romántica',
    historia: 'Danza apasionada que nació en los orígenes del siglo XX. Fusiona ritmos africanos, europeos e indígenas, convirtiéndose en símbolo cultural argentino mundial.',
    coreografia: 'Abrazos cercanos, movimientos sincrónicos de parejas, pasos rápidos y lentos alternados, giros dramáticos. Expresión de pasión y conexión emocional.',
    video_url: 'https://www.youtube.com/embed/wGzX0TjOcl8'
  },
  {
    nombre: 'Gato',
    region: 'Centro (Córdoba, Buenos Aires, Entre Ríos)',
    caracter: 'festiva',
    historia: 'Danza satírica y burlona que juega con la seducción. El gato era danza de fiesta entre gauchos que bromeaban y desafiaban en el baile.',
    coreografia: 'Saltos, giros rápidos, movimientos jocosos, desafíos entre bailarines, zapateos muy marcados. Ritmo vivo en 6/8.',
    video_url: 'https://www.youtube.com/embed/5nZUE44vMNU'
  },
  {
    nombre: 'Chamamé',
    region: 'Misiones y Corrientes',
    caracter: 'romántica',
    historia: 'Danza romántica y melódica con raíces guaraní, jesuitica e hispánica. Muy popular en las provincias de Misiones y Corrientes, es danza de parejas muy abrazadas.',
    coreografia: 'Movimientos suaves y deslizantes, giros constantes, abrazo cerrado, pasos cortos y rítmicos. Ritmo en 2/4 muy particular.',
    video_url: 'https://www.youtube.com/embed/7mJ5HwKEGdE'
  }
];

const eventos = [
  {
    titulo: 'Peña Folklórica Mensual',
    fecha: '2025-09-06',
    lugar: 'Centro Cultural San Miguel, Corrientes',
    descripcion: 'Encuentro mensual de danzas folklóricas con presentaciones en vivo y espacio para participar. Entrada libre, almuerzo folklórico disponible.'
  },
  {
    titulo: 'Taller de Chacarera Intermedio',
    fecha: '2025-09-13',
    lugar: 'Estudio de Danzas Folklóricas, San Miguel',
    descripcion: 'Taller intensivo sobre técnica y coreografía de Chacarera. Requisito: experiencia previa en danzas folklóricas.'
  },
  {
    titulo: 'Festival de Danzas de la Mesopotamia',
    fecha: '2025-10-12',
    lugar: 'Plaza Pública, Corrientes',
    descripcion: 'Festival anual con presentaciones de grupos folklóricos, talleres gratuitos y venta de artesanías tradicionales.'
  }
];

const comentarios = [
  {
    nombre: 'María González',
    mensaje: 'Excelente plataforma para aprender sobre nuestras danzas. Muy educativo y bien estructurado.',
    estado: 'aprobado'
  },
  {
    nombre: 'Juan Pérez',
    mensaje: 'Los videos de YouTube son muy útiles. Gracias por esta iniciativa cultural.',
    estado: 'aprobado'
  },
  {
    nombre: 'Ana Torres',
    mensaje: 'Me encantaría que agreguen más danzas del Litoral. ¡Sigan con este hermoso trabajo!',
    estado: 'pendiente'
  }
];

// DDL según el motor (definido en ddl.js)
const DDL_DANZAS = ddl.danzas;
const DDL_EVENTOS = ddl.eventos;
const DDL_COMENTARIOS = ddl.comentarios;

async function main() {
  console.log(`🗄️  Inicializando base de datos: ${db.isPostgres ? 'PostgreSQL' : 'SQLite'}`);

  // Crear tablas
  await db.run(DDL_DANZAS);
  await db.run(DDL_EVENTOS);
  await db.run(DDL_COMENTARIOS);

  // Tablas de cursos premium y códigos (se crean pero no se borran: son datos del admin)
  await db.run(ddl.cursos);
  await db.run(ddl.codigos);

  // Tabla de configuración (portada, botón de descarga): también se respeta
  await db.run(ddl.config);

  // Tabla de recursos (material gratis)
  await db.run(ddl.recursos);

  // Migración: asegurar columna estado en comentarios
  if (db.isPostgres) {
    await db.run("ALTER TABLE comentarios ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'pendiente'");
  } else {
    const cols = await db.all('PRAGMA table_info(comentarios)');
    if (!cols.some(c => c.name === 'estado')) {
      await db.run("ALTER TABLE comentarios ADD COLUMN estado TEXT NOT NULL DEFAULT 'pendiente'");
    }
  }

  // Migración: asegurar columna caracter en danzas
  if (db.isPostgres) {
    await db.run("ALTER TABLE danzas ADD COLUMN IF NOT EXISTS caracter TEXT DEFAULT 'festiva'");
  } else {
    const cols = await db.all('PRAGMA table_info(danzas)');
    if (!cols.some(c => c.name === 'caracter')) {
      await db.run("ALTER TABLE danzas ADD COLUMN caracter TEXT DEFAULT 'festiva'");
    }
  }

  // Migración: asegurar columna imagen_url en danzas
  if (db.isPostgres) {
    await db.run('ALTER TABLE danzas ADD COLUMN IF NOT EXISTS imagen_url TEXT');
  } else {
    const cols = await db.all('PRAGMA table_info(danzas)');
    if (!cols.some(c => c.name === 'imagen_url')) {
      await db.run('ALTER TABLE danzas ADD COLUMN imagen_url TEXT');
    }
  }

  // Solo sembrar si las tablas están vacías (no pisar datos del admin en cada deploy)
  const countD = await db.get('SELECT COUNT(*) AS c FROM danzas');
  const countE = await db.get('SELECT COUNT(*) AS c FROM eventos');
  const countC = await db.get('SELECT COUNT(*) AS c FROM comentarios');

  if (countD.c > 0 || countE.c > 0 || countC.c > 0) {
    console.log('ℹ️  Las tablas ya tienen datos. No se vuelven a sembrar para no pisar la información existente.');
    console.log('    (Si querés reiniciar todo, borrá las filas o usá un entorno limpio.)');
    await db.close();
    return;
  }

  // Limpiar tablas (base recién creada)
  await db.run('DELETE FROM danzas');
  await db.run('DELETE FROM eventos');
  await db.run('DELETE FROM comentarios');

  // Insertar danzas
  for (const d of danzas) {
    await db.run(
      'INSERT INTO danzas (nombre, region, caracter, historia, coreografia, video_url, imagen_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [d.nombre, d.region, d.caracter, d.historia, d.coreografia, d.video_url, d.imagen_url || '']
    );
    console.log(`✓ Insertado: ${d.nombre} (${d.caracter})`);
  }

  // Insertar eventos
  for (const ev of eventos) {
    await db.run(
      'INSERT INTO eventos (titulo, fecha, lugar, descripcion) VALUES (?, ?, ?, ?)',
      [ev.titulo, ev.fecha, ev.lugar, ev.descripcion]
    );
    console.log(`✓ Insertado evento: ${ev.titulo}`);
  }

  // Insertar comentarios de ejemplo
  for (const c of comentarios) {
    const fecha = new Date().toISOString();
    await db.run(
      'INSERT INTO comentarios (nombre, mensaje, fecha, estado) VALUES (?, ?, ?, ?)',
      [c.nombre, c.mensaje, fecha, c.estado]
    );
    console.log(`✓ Insertado comentario de ${c.nombre} (${c.estado})`);
  }

  console.log('\n✓ Base de datos inicializada correctamente.');
  await db.close();
}

main().catch((err) => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});
