const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'danzas.db');
const db = new sqlite3.Database(dbPath);

// Datos de ejemplo para danzas folklóricas argentinas
const danzas = [
  {
    nombre: 'Chacarera',
    region: 'Noroeste (Salta, Jujuy, Tucumán)',
    historia: 'Danza festiva de origen andino que representa la cosecha y la alegría. Es una danza de parejas con movimientos alegres y energéticos que celebran el trabajo en el campo.',
    coreografia: 'Movimientos circulares, giros de parejas, palmoteos rítmicos, pasos alternados. Se ejecuta en tiempo de 6/8.',
    video_url: 'https://www.youtube.com/embed/CKG_5PFQIA4'
  },
  {
    nombre: 'Cueca',
    region: 'Noroeste (compartida con Chile)',
    historia: 'Danza de cortejo entre hombre y mujer que simula el galanteo de un gallo con una gallina. Tiene movimientos elegantes y coquetos que expresan el juego amoroso.',
    coreografia: 'Movimientos de cadera, giros, juego de pañuelos, movimientos de brazos elegantes. Tiempo de 2/4 con un ritmo muy particular.',
    video_url: 'https://www.youtube.com/embed/iQWxNgL9z24'
  },
  {
    nombre: 'Zamba',
    region: 'Centro y Noroeste',
    historia: 'Danza lenta y sensual de parejas que expresa amor y elegancia. Originaria del siglo XVIII, refleja la influencia criolla y el romanticismo latinoamericano.',
    coreografia: 'Pasos deslizantes, movimientos suaves de caderas, brazos serpenteantes, uso de pañuelos. Ritmo 6/8 muy lento y expresivo.',
    video_url: 'https://www.youtube.com/embed/k5qJFTNcyO8'
  },
  {
    nombre: 'Tango',
    region: 'Buenos Aires y Río de la Plata',
    historia: 'Danza apasionada que nació en los orígenes del siglo XX. Fusiona ritmos africanos, europeos e indígenas, convirtiéndose en símbolo cultural argentino mundial.',
    coreografia: 'Abrazos cercanos, movimientos sincrónicos de parejas, pasos rápidos y lentos alternados, giros dramáticos. Expresión de pasión y conexión emocional.',
    video_url: 'https://www.youtube.com/embed/wGzX0TjOcl8'
  },
  {
    nombre: 'Gato',
    region: 'Centro (Córdoba, Buenos Aires, Entre Ríos)',
    historia: 'Danza satírica y burlona que juega con la seducción. El gato era danza de fiesta entre gauchos que bromeaban y desafiaban en el baile.',
    coreografia: 'Saltos, giros rápidos, movimientos jocosos, desafíos entre bailarines, zapateos muy marcados. Ritmo vivo en 6/8.',
    video_url: 'https://www.youtube.com/embed/5nZUE44vMNU'
  },
  {
    nombre: 'Chamamé',
    region: 'Misiones y Corrientes',
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

db.serialize(() => {
  // Crear tabla de danzas
  db.run(`
    CREATE TABLE IF NOT EXISTS danzas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      region TEXT NOT NULL,
      historia TEXT,
      coreografia TEXT,
      video_url TEXT
    )
  `);

  // Crear tabla de eventos
  db.run(`
    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      fecha TEXT NOT NULL,
      lugar TEXT,
      descripcion TEXT
    )
  `);

  // Crear tabla de comentarios
  db.run(`
    CREATE TABLE IF NOT EXISTS comentarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      fecha TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente'
    )
  `);

  // Migración: agregar columna "estado" si la tabla ya existía sin ella
  db.all("PRAGMA table_info(comentarios)", (pragmaErr, columnas) => {
    if (pragmaErr) {
      console.error('Error al inspeccionar comentarios:', pragmaErr);
      return;
    }
    if (!columnas.some(c => c.name === 'estado')) {
      db.run("ALTER TABLE comentarios ADD COLUMN estado TEXT NOT NULL DEFAULT 'pendiente'", (alterErr) => {
        if (alterErr) {
          console.error('Error al migrar comentarios:', alterErr.message);
        } else {
          console.log('✓ Columna "estado" agregada a comentarios');
        }
      });
    }
  });

  // Limpiar tablas
  db.run('DELETE FROM danzas');
  db.run('DELETE FROM eventos');
  db.run('DELETE FROM comentarios');

  // Insertar danzas
  danzas.forEach(danza => {
    db.run(
      'INSERT INTO danzas (nombre, region, historia, coreografia, video_url) VALUES (?, ?, ?, ?, ?)',
      [danza.nombre, danza.region, danza.historia, danza.coreografia, danza.video_url],
      (err) => {
        if (err) {
          console.error(`Error al insertar ${danza.nombre}:`, err);
        } else {
          console.log(`✓ Insertado: ${danza.nombre}`);
        }
      }
    );
  });

  // Insertar eventos
  eventos.forEach(evento => {
    db.run(
      'INSERT INTO eventos (titulo, fecha, lugar, descripcion) VALUES (?, ?, ?, ?)',
      [evento.titulo, evento.fecha, evento.lugar, evento.descripcion],
      (err) => {
        if (err) {
          console.error(`Error al insertar evento:`, err);
        } else {
          console.log(`✓ Insertado evento: ${evento.titulo}`);
        }
      }
    );
  });

  // Insertar comentarios de ejemplo
  comentarios.forEach(comentario => {
    const fecha = new Date().toISOString();
    db.run(
      'INSERT INTO comentarios (nombre, mensaje, fecha, estado) VALUES (?, ?, ?, ?)',
      [comentario.nombre, comentario.mensaje, fecha, comentario.estado],
      (err) => {
        if (err) {
          console.error(`Error al insertar comentario de ${comentario.nombre}:`, err);
        } else {
          console.log(`✓ Insertado comentario de ${comentario.nombre} (${comentario.estado})`);
        }
      }
    );
  });
});

db.close(() => {
  console.log('\n✓ Base de datos inicializada correctamente en:', dbPath);
});
