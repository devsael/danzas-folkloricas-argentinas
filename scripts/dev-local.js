// Levanta backend (puerto 3000) y frontend estático (puerto 8000) juntos.
// Uso: npm run dev:all  (o)  node scripts/dev-local.js
//
// - Mata primero cualquier proceso viejo del proyecto que haya quedado
//   escuchando en 3000/8000 (evita el EADDRINUSE clásico).
// - Imprime ambas salidas con prefijos.
// - Ctrl+C apaga ambos hijos.

const { spawn, execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

function matarPuerto(puerto) {
  let pid = null;
  try {
    // Solo para sistemas donde netstat existe (Windows/Unix/Mac)
    const out = execSync(`netstat -ano | findstr ":${puerto}" | findstr LISTENING`).toString();
    const linea = out.split(/\r?\n/).find((l) => /LISTENING/i.test(l));
    if (linea) pid = linea.trim().split(/\s+/).pop();
  } catch (e) {
    // no había nada escuchando en el puerto
  }
  if (pid) {
    try {
      process.kill(Number(pid));
      console.log(`[dev] Puerto ${puerto}: proceso ${pid} cerrado`);
    } catch (e) {
      console.log(`[dev] Puerto ${puerto}: no se pudo liberar (${e.message})`);
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

const frontend = spawn('python', ['-m', 'http.server', '8000'], {
  cwd: path.join(root, 'frontend'),
  shell: true
});

backend.stdout.on('data', (d) => process.stdout.write(`[API] ${d}`));
backend.stderr.on('data', (d) => process.stdout.write(`[API] ${d}`));
frontend.stdout.on('data', (d) => process.stdout.write(`[WEB] ${d}`));
frontend.stderr.on('data', (d) => process.stdout.write(`[WEB] ${d}`));

function cerrarTodo() {
  console.log('\n[dev] Apagando...');
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on('SIGINT', cerrarTodo);
process.on('SIGTERM', cerrarTodo);

console.log('[dev] Backend -> http://localhost:3000');
console.log('[dev] Frontend -> http://localhost:8000');
console.log('[dev] Admin -> http://localhost:8000/admin.html');