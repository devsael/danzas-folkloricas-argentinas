// ============================================
// GENERAR COPIA GUARDADA DE LAS DANZAS
// ============================================
// Descarga las danzas de la API (producción por defecto) y escribe
// frontend/danzas-cache.js. Esa copia se muestra al instante en la página y
// sirve de respaldo si la API no responde.
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

  const contenido =
    '// Copia guardada de las danzas (respaldo estatico).\n' +
    '// Se muestra al instante y como respaldo si la API de Render no responde.\n' +
    '// Se actualiza con "npm run generar-cache".\n' +
    'window.DANZAS_CACHE = ' + JSON.stringify(json.data, null, 4) + ';\n';

  const destino = path.join(__dirname, '..', 'frontend', 'danzas-cache.js');
  fs.writeFileSync(destino, contenido, 'utf8');

  console.log(`✓ Copia guardada con ${json.data.length} danzas en frontend/danzas-cache.js`);
  console.log('   Recordá subir los cambios a GitHub para que se despliegue.');
}

main().catch((err) => {
  console.error('Error al generar la copia:', err.message);
  process.exit(1);
});
