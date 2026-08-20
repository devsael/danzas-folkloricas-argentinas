// Levanta backend (puerto 3000) y frontend estático (puerto 8000) juntos.
// Uso: npm run dev:all  (o)  node scripts/dev-local.js
//
// - Mata primero cualquier proceso viejo del proyecto que haya quedado
//   escuchando en 3000/8000 (evita el EADDRINUSE clásico).
// - Imprime ambas salidas con prefijos.
// - Ctrl+C apaga ambos hijos.

const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function matarPuerto(puerto) {
  let pid = null;
  try {
    const out = execSync(`netstat -ano | findstr ":${puerto}" | findstr LISTENING`).toString();
    const linea = out.split(/\r?\n/).find((l) => /LISTENING/i.test(l));
    if (linea) pid = linea.trim().split(/\s+/).pop();
  } catch (e) {
    // no había nada escuchando en el puerto
  }
  if (pid) {
    // Intento doble: process.kill y, si hace falta, Stop-Process de PowerShell
    // (más confiable en Windows para matar procesos de otras sesiones).
    try {
      process.kill(Number(pid));
      console.log(`[dev] Puerto ${puerto}: proceso ${pid} cerrado`);
    } catch (e) {
      const psKill = `powershell -NoProfile -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`;
      try {
        execSync(psKill);
        console.log(`[dev] Puerto ${puerto}: proceso ${pid} cerrado (PowerShell)`);
      } catch (e2) {
        console.log(`[dev] ⚠️ Puerto ${puerto}: no pude liberar el proceso ${pid}. Cerralo manualmente.`);
      }
    }
  }
}

matarPuerto(3000);
matarPuerto(8000);

const backend = spawn('node', ['--watch', 'server.js'], {
  cwd: path.join(root, 'backend'),
  env: { ...process.env },
  shell: true
});

// Servidor estático en Node puro (sin depender de Python) para el frontend.
const frontendDir = path.join(root, 'frontend');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

const frontend = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let relative = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  if (relative.includes('..') || relative.includes(':\\')) {
    res.writeHead(403);
    return res.end('403');
  }
  const filePath = path.join(frontendDir, relative);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('404 no encontrado');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

frontend.listen(8000, () => {
  console.log('[WEB] Frontend en http://localhost:8000');
});
frontend.on('error', (e) => {
  console.error('[WEB] Error al iniciar el servidor estático:', e.message);
  process.exit(1);
});

// Verificación: a los 3 segundos avisa si el backend no está escuchando.
setTimeout(() => {
  const ok = execSync('netstat -ano | findstr ":3000" | findstr LISTENING', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString().trim().length > 0;
  if (!ok) {
    console.log('');
    console.log('[API] ❌ El backend NO está corriendo en el puerto 3000.');
    console.log('[API]    Posible causa: otro proceso ocupa el puerto 3000 o el server.js falla al iniciar.');
    console.log('[API]    Revisá los mensajes [API] de arriba. Si dice EADDRINUSE, cerrá el otro server.');
    console.log('');
  } else {
    console.log('[API] ✅ Backend corriendo en http://localhost:3000');
  }
}, 3000);

backend.stdout.on('data', (d) => process.stdout.write(`[API] ${d}`));
backend.stderr.on('data', (d) => process.stdout.write(`[API] ${d}`));

function cerrarTodo() {
  console.log('\n[dev] Apagando...');
  backend.kill();
  frontend.close();
  process.exit(0);
}

process.on('SIGINT', cerrarTodo);
process.on('SIGTERM', cerrarTodo);

console.log('[dev] Backend -> http://localhost:3000');
console.log('[dev] Frontend -> http://localhost:8000');
console.log('[dev] Admin -> http://localhost:8000/admin.html');