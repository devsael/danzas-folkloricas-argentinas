// ============================================
// GENERAR COPIA GUARDADA DE LAS DANZAS (+ SEO)
// ============================================
// Descarga las danzas de la API (producción por defecto) y:
//   1) escribe frontend/danzas-cache.js (copia estática: se muestra al
//      instante y sirve de respaldo si la API no responde).
//   2) actualiza frontend/index.html:
//      - JSON-LD (ItemList) en <head> para que Google lea las danzas.
//      - las tarjetas de las danzas precargadas en el HTML (los buscadores
//        ven el contenido sin ejecutar JavaScript).
//
// Uso:
//   npm run generar-cache
//   # con otra URL:
//   npm run generar-cache -- --url=http://localhost:3000
// ============================================

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const urlArg = args.find(a => a.startsWith('--url='));
const API_URL = urlArg ? urlArg.slice(6) : 'https://danzas-folkloricas-api.onrender.com';

const SITIO_URL = 'https://devsael.github.io/danzas-folkloricas-argentinas/';
const INDEX_PATH = path.join(__dirname, '..', 'frontend', 'index.html');

// ==== Replicas de las utilidades de frontend/script.js (para el HTML estático) ====

function escapeHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function urlSegura(url) {
  const u = String(url || '').trim();
  if (/^https?:\/\//i.test(u)) return u;
  return '';
}

function urlImagenParaMostrar(url) {
  if (!url) return '';
  const m1 = url.match(/[?&]id=([^&]+)/);
  const m2 = url.match(/\/d\/([^/]+)/);
  const id = m1 ? m1[1] : (m2 ? m2[1] : null);
  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
  return url;
}

const POSICIONES_IMAGEN = [
  'left top', 'center top', 'right top',
  'left center', 'center center', 'right center',
  'left bottom', 'center bottom', 'right bottom'
];

function posicionImagen(valor) {
  return POSICIONES_IMAGEN.includes(String(valor || '').trim()) ? valor : 'center center';
}

const CARACTERES = {
  'festiva':     { label: 'Festiva',     emoji: '🎉' },
  'ceremonial':  { label: 'Ceremonial',  emoji: '🪔' },
  'romántica':   { label: 'Romántica',   emoji: '💞' },
  'guerrera':    { label: 'Guerrera',    emoji: '⚔️' },
  'comunitaria': { label: 'Comunitaria', emoji: '👥' },
  'ritual':      { label: 'Ritual',      emoji: '🌀' }
};

function badgeCaracter(caracter) {
  const info = CARACTERES[caracter] || { label: caracter || 'Festiva', emoji: '🎉' };
  const clave = CARACTERES[caracter] ? caracter : 'festiva';
  return `<span class="caracter-badge caracter-${clave}">${info.emoji} ${escapeHtml(info.label)}</span>`;
}

function cardDanza(danza) {
  const inicial = (danza.nombre || '?').trim().charAt(0).toUpperCase();
  const imgUrl = urlSegura(urlImagenParaMostrar(danza.imagen_url));
  const posicion = posicionImagen(danza.imagen_posicion);
  const imagenHtml = imgUrl
    ? `<div class="danza-image"><img src="${imgUrl}" alt="${escapeHtml(danza.nombre)}" loading="lazy" style="object-position:${posicion};"></div>`
    : `<div class="danza-image"><span class="danza-inicial">${escapeHtml(inicial)}</span></div>`;

  return [
    '            <div class="danza-card">',
    imagenHtml,
    '                <div class="danza-content">',
    `                    <h3>${escapeHtml(danza.nombre)}</h3>`,
    `                    <span class="danza-region">📍 ${escapeHtml(danza.region)}</span>`,
    `                    ${badgeCaracter(danza.caracter)}`,
    `                    <p class="danza-description">${escapeHtml((danza.historia || '').substring(0, 100))}...</p>`,
    `                    <button class="danza-button" onclick="abrirModalDanza(${danza.id})">`,
    '                        Ver Detalles',
    '                    </button>',
    '                </div>',
    '            </div>'
  ].join('\n');
}

function generarLdjson(danzas) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Danzas Folklóricas Argentinas',
    'itemListElement': danzas.map((d, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'item': {
        '@type': 'CreativeWork',
        'name': d.nombre || '',
        'description': (d.historia || '').substring(0, 200),
        'image': urlSegura(urlImagenParaMostrar(d.imagen_url)),
        'url': SITIO_URL + '#danzas',
        'inLanguage': 'es-AR'
      }
    }))
  };
}

async function main() {
  console.log(`📡 Descargando danzas de: ${API_URL}`);
  const respuesta = await fetch(`${API_URL}/api/danzas?limit=100`);
  if (!respuesta.ok) {
    throw new Error(`La API respondió ${respuesta.status}`);
  }
  const json = await respuesta.json();
  if (!json.success) {
    throw new Error('La API no devolvió datos válidos');
  }
  const danzas = json.data || [];

  // 1) Copia estática (respaldo)
  const contenidoCache =
    '// Copia guardada de las danzas (respaldo estatico).\n' +
    '// Se muestra al instante y como respaldo si la API de Render no responde.\n' +
    '// Se actualiza con "npm run generar-cache".\n' +
    'window.DANZAS_CACHE = ' + JSON.stringify(danzas, null, 4) + ';\n';

  const destino = path.join(__dirname, '..', 'frontend', 'danzas-cache.js');
  fs.writeFileSync(destino, contenidoCache, 'utf8');
  console.log(`✓ Copia guardada con ${danzas.length} danzas en frontend/danzas-cache.js`);

  // 2) Actualizar frontend/index.html (JSON-LD + tarjetas estáticas)
  if (!fs.existsSync(INDEX_PATH)) {
    console.log('   (no se encontró index.html, se omite la parte SEO)');
    return;
  }

  let indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
  const ldjson = JSON.stringify(generarLdjson(danzas), null, 4);

  indexHtml = indexHtml.replace(
    /(<script type="application\/ld\+json" id="danzas-ldjson">\s*)[\s\S]*?(\s*<\/script>)/,
    (match, pre, post) => pre + ldjson + post
  );

  const seoHtml = danzas.map(cardDanza).join('\n');
  indexHtml = indexHtml.replace(
    /<!-- DANZAS SEO: inicio -->[\s\S]*?<!-- DANZAS SEO: fin -->/,
    '<!-- DANZAS SEO: inicio -->\n' + seoHtml + '\n                <!-- DANZAS SEO: fin -->'
  );

  fs.writeFileSync(INDEX_PATH, indexHtml, 'utf8');
  console.log(`✓ frontend/index.html actualizado con ${danzas.length} danzas (JSON-LD + HTML estático)`);
  console.log('   Recordá subir los cambios a GitHub para que se despliegue.');
}

main().catch((err) => {
  console.error('Error al generar la copia:', err.message);
  process.exit(1);
});
