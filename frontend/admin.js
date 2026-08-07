// ============================================
// CONFIGURACIÓN
// ============================================
// IMPORTANTE: debe ser la MISMA URL que usás en script.js
const API_URL = 'https://danzas-folkloricas-api.onrender.com'; // Backend en Render

// ============================================
// CLAVE DE ADMINISTRADOR
// ============================================
// La clave se guarda SOLO en la sesión del navegador (sessionStorage) y se
// envía en cada request de escritura vía el header X-API-Key. El servidor la
// valida: sin la clave correcta no se puede crear, editar ni borrar nada.
const ADMIN_KEY_STORAGE = 'admin_key_danzas';
const adminLoginOverlay = document.getElementById('admin-login');
const adminLoginForm = document.getElementById('admin-login-form');
const adminKeyInput = document.getElementById('admin-key-input');
const adminLoginStatus = document.getElementById('admin-login-status');

function getAdminKey() {
    return sessionStorage.getItem(ADMIN_KEY_STORAGE) || '';
}

function setAdminKey(key) {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
}

function clearAdminKey() {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
}

function adminHeaders(extra = {}) {
    return Object.assign({ 'Content-Type': 'application/json', 'X-API-Key': getAdminKey() }, extra);
}

function manejarNoAutorizado() {
    clearAdminKey();
    adminLoginStatus.className = 'form-status error';
    adminLoginStatus.textContent = 'La clave no es válida o expiró. Ingresá la clave de nuevo.';
    adminLoginStatus.style.display = 'block';
    adminLoginOverlay.style.display = 'flex';
}

async function verificarClaveAdmin() {
    try {
        const response = await fetch(`${API_URL}/api/comentarios/pendientes`, {
            headers: { 'X-API-Key': getAdminKey() }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = adminKeyInput.value.trim();
    if (!key) return;

    setAdminKey(key);
    const ok = await verificarClaveAdmin();

    if (ok) {
        adminLoginOverlay.style.display = 'none';
        adminLoginStatus.style.display = 'none';
        iniciarAdmin();
    } else {
        clearAdminKey();
        adminLoginStatus.className = 'form-status error';
        adminLoginStatus.textContent = 'Clave incorrecta o no se pudo conectar con el servidor.';
        adminLoginStatus.style.display = 'block';
    }
});

function iniciarAdmin() {
    cargarDanzasAdmin();
    cargarEventosAdmin();
    cargarComentariosAdmin();
    cargarCursosAdmin();
    cargarCodigosAdmin();
    cargarRecursosAdmin();
    cargarConfigAdmin();
    cargarEstadisticas();
}

// ============================================
// TABS
// ============================================

const tabButtons = document.querySelectorAll('.admin-tab-btn');
const panels = document.querySelectorAll('.admin-panel');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
    });
});

// ============================================
// UTILIDAD: mostrar estado de formulario
// ============================================

function mostrarEstado(elementId, mensaje, tipo) {
    const el = document.getElementById(elementId);
    el.className = `form-status ${tipo}`;
    el.textContent = mensaje;
    el.style.display = 'block';

    if (tipo === 'success') {
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}

// ============================================
// CARÁCTER DE LAS DANZAS
// ============================================

const CARACTERES_ADMIN = {
    'festiva':     { label: 'Festiva',     emoji: '🎉' },
    'ceremonial':  { label: 'Ceremonial',  emoji: '🪔' },
    'romántica':   { label: 'Romántica',   emoji: '💞' },
    'guerrera':    { label: 'Guerrera',    emoji: '⚔️' },
    'comunitaria': { label: 'Comunitaria', emoji: '👥' },
    'ritual':      { label: 'Ritual',      emoji: '🌀' }
};

function badgeCaracterAdmin(caracter) {
    const info = CARACTERES_ADMIN[caracter] || { label: caracter || 'Festiva', emoji: '🎉' };
    const clave = CARACTERES_ADMIN[caracter] ? caracter : 'festiva';
    return `<span class="caracter-badge caracter-${clave}">${info.emoji} ${escapeHtml(info.label)}</span>`;
}

// Convierte cualquier enlace de Google Drive en una URL de imagen para <img>
function urlImagenParaMostrar(url) {
    if (!url) return '';
    const m1 = url.match(/[?&]id=([^&]+)/);
    const m2 = url.match(/\/d\/([^/]+)/);
    const id = m1 ? m1[1] : (m2 ? m2[1] : null);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
    return url;
}

// Solo permite URLs http/https (bloquea javascript:, data:, etc.)
function urlSeguraAdmin(url) {
    const u = String(url || '').trim();
    if (/^https?:\/\//i.test(u)) return u;
    return '';
}

// ============================================
// DANZAS
// ============================================

const formDanza = document.getElementById('form-danza');
const danzaSubmitBtn = document.getElementById('danza-submit-btn');
const danzaCancelBtn = document.getElementById('danza-cancel-btn');
const danzaFormTitle = document.getElementById('danza-form-title');

let danzasCache = [];

formDanza.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('d-id').value;
    const nombre = document.getElementById('d-nombre').value.trim();
    const region = document.getElementById('d-region').value.trim();
    const caracter = document.getElementById('d-caracter').value;
    const historia = document.getElementById('d-historia').value.trim();
    const coreografia = document.getElementById('d-coreografia').value.trim();
    const video_url = document.getElementById('d-video').value.trim();
    const imagen_url = document.getElementById('d-imagen').value.trim();

    if (!nombre || !region || !caracter) {
        mostrarEstado('danza-status', 'Nombre, región y carácter son obligatorios', 'error');
        return;
    }

    const esEdicion = !!id;
    const url = esEdicion ? `${API_URL}/api/danzas/${id}` : `${API_URL}/api/danzas`;
    const method = esEdicion ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: adminHeaders(),
            body: JSON.stringify({ nombre, region, caracter, historia, coreografia, video_url, imagen_url })
        });

        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            mostrarEstado('danza-status', esEdicion
                ? `✓ "${nombre}" fue actualizada correctamente`
                : `✓ "${nombre}" fue agregada correctamente`, 'success');
            cancelarEdicionDanza();
            cargarDanzasAdmin();
        } else {
            mostrarEstado('danza-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('danza-status', 'No se pudo conectar con el servidor', 'error');
    }
});

danzaCancelBtn.addEventListener('click', cancelarEdicionDanza);

function cancelarEdicionDanza() {
    formDanza.reset();
    document.getElementById('d-id').value = '';
    danzaFormTitle.textContent = 'Nueva Danza';
    danzaSubmitBtn.textContent = 'Guardar Danza';
    danzaCancelBtn.style.display = 'none';
}

function editarDanza(id) {
    const danza = danzasCache.find(d => d.id === id);
    if (!danza) return;

    document.getElementById('d-id').value = danza.id;
    document.getElementById('d-nombre').value = danza.nombre;
    document.getElementById('d-region').value = danza.region;
    document.getElementById('d-caracter').value = danza.caracter || 'festiva';
    document.getElementById('d-historia').value = danza.historia || '';
    document.getElementById('d-coreografia').value = danza.coreografia || '';
    document.getElementById('d-video').value = danza.video_url || '';
    document.getElementById('d-imagen').value = danza.imagen_url || '';

    danzaFormTitle.textContent = `Editando: ${danza.nombre}`;
    danzaSubmitBtn.textContent = 'Actualizar Danza';
    danzaCancelBtn.style.display = 'inline-block';

    document.querySelector('.admin-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function eliminarDanza(id) {
    const danza = danzasCache.find(d => d.id === id);
    const nombre = danza ? danza.nombre : 'esta danza';

    if (!confirm(`¿Seguro que querés eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/danzas/${id}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': getAdminKey() }
        });
        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            mostrarEstado('danza-status', `✓ "${nombre}" fue eliminada`, 'success');
            cargarDanzasAdmin();
        } else {
            mostrarEstado('danza-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('danza-status', 'No se pudo conectar con el servidor', 'error');
    }
}

async function cargarDanzasAdmin() {
    const lista = document.getElementById('danzas-admin-lista');
    try {
        const response = await fetch(`${API_URL}/api/danzas`);
        const json = await response.json();

        if (json.success && json.data.length > 0) {
            danzasCache = json.data;
            lista.innerHTML = json.data.map(d => {
                const imgUrl = urlSeguraAdmin(urlImagenParaMostrar(d.imagen_url));
                const mini = imgUrl ? `<img class="admin-thumb" src="${imgUrl}" alt="${escapeHtml(d.nombre)}" loading="lazy">` : '';
                return `
                <div class="admin-list-item">
                    ${mini}
                    <div class="admin-list-content">
                        <h4>💃 ${escapeHtml(d.nombre)}</h4>
                        <p><strong>Región:</strong> ${escapeHtml(d.region)}</p>
                        <p>${badgeCaracterAdmin(d.caracter)}</p>
                        <p>${escapeHtml((d.historia || '').substring(0, 120))}${d.historia && d.historia.length > 120 ? '...' : ''}</p>
                    </div>
                    <div class="admin-list-actions">
                        <button class="admin-action-btn btn-editar" onclick="editarDanza(${d.id})">Editar</button>
                        <button class="admin-action-btn btn-eliminar" onclick="eliminarDanza(${d.id})">Eliminar</button>
                    </div>
                </div>
            `;
            }).join('');
        } else {
            danzasCache = [];
            lista.innerHTML = '<p class="loading">Todavía no hay danzas cargadas</p>';
        }
    } catch (error) {
        lista.innerHTML = '<p class="loading">⚠️ No se pudo conectar con el servidor</p>';
    }
}

// ============================================
// EVENTOS
// ============================================

const formEvento = document.getElementById('form-evento');
const eventoSubmitBtn = document.getElementById('evento-submit-btn');
const eventoCancelBtn = document.getElementById('evento-cancel-btn');
const eventoFormTitle = document.getElementById('evento-form-title');

let eventosCache = [];

formEvento.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('e-id').value;
    const titulo = document.getElementById('e-titulo').value.trim();
    const fecha = document.getElementById('e-fecha').value;
    const lugar = document.getElementById('e-lugar').value.trim();
    const descripcion = document.getElementById('e-descripcion').value.trim();

    if (!titulo || !fecha) {
        mostrarEstado('evento-status', 'Título y fecha son obligatorios', 'error');
        return;
    }

    const esEdicion = !!id;
    const url = esEdicion ? `${API_URL}/api/eventos/${id}` : `${API_URL}/api/eventos`;
    const method = esEdicion ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: adminHeaders(),
            body: JSON.stringify({ titulo, fecha, lugar, descripcion })
        });

        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            mostrarEstado('evento-status', esEdicion
                ? `✓ "${titulo}" fue actualizado correctamente`
                : `✓ "${titulo}" fue agregado correctamente`, 'success');
            cancelarEdicionEvento();
            cargarEventosAdmin();
        } else {
            mostrarEstado('evento-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('evento-status', 'No se pudo conectar con el servidor', 'error');
    }
});

eventoCancelBtn.addEventListener('click', cancelarEdicionEvento);

function cancelarEdicionEvento() {
    formEvento.reset();
    document.getElementById('e-id').value = '';
    eventoFormTitle.textContent = 'Nuevo Evento';
    eventoSubmitBtn.textContent = 'Guardar Evento';
    eventoCancelBtn.style.display = 'none';
}

function editarEvento(id) {
    const evento = eventosCache.find(ev => ev.id === id);
    if (!evento) return;

    document.getElementById('e-id').value = evento.id;
    document.getElementById('e-titulo').value = evento.titulo;
    document.getElementById('e-fecha').value = evento.fecha;
    document.getElementById('e-lugar').value = evento.lugar || '';
    document.getElementById('e-descripcion').value = evento.descripcion || '';

    eventoFormTitle.textContent = `Editando: ${evento.titulo}`;
    eventoSubmitBtn.textContent = 'Actualizar Evento';
    eventoCancelBtn.style.display = 'inline-block';

    document.querySelectorAll('.admin-form-card')[1].scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function eliminarEvento(id) {
    const evento = eventosCache.find(ev => ev.id === id);
    const titulo = evento ? evento.titulo : 'este evento';

    if (!confirm(`¿Seguro que querés eliminar "${titulo}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/eventos/${id}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': getAdminKey() }
        });
        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            mostrarEstado('evento-status', `✓ "${titulo}" fue eliminado`, 'success');
            cargarEventosAdmin();
        } else {
            mostrarEstado('evento-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('evento-status', 'No se pudo conectar con el servidor', 'error');
    }
}

async function cargarEventosAdmin() {
    const lista = document.getElementById('eventos-admin-lista');
    try {
        const response = await fetch(`${API_URL}/api/eventos`);
        const json = await response.json();

        if (json.success && json.data.length > 0) {
            eventosCache = json.data;
            lista.innerHTML = json.data.map(ev => {
                const fecha = new Date(ev.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                return `
                    <div class="admin-list-item">
                        <div class="admin-list-content">
                            <h4>📅 ${escapeHtml(ev.titulo)}</h4>
                            <p><strong>${fecha}</strong>${ev.lugar ? ' — ' + escapeHtml(ev.lugar) : ''}</p>
                            <p>${escapeHtml((ev.descripcion || '').substring(0, 120))}${ev.descripcion && ev.descripcion.length > 120 ? '...' : ''}</p>
                        </div>
                        <div class="admin-list-actions">
                            <button class="admin-action-btn btn-editar" onclick="editarEvento(${ev.id})">Editar</button>
                            <button class="admin-action-btn btn-eliminar" onclick="eliminarEvento(${ev.id})">Eliminar</button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            eventosCache = [];
            lista.innerHTML = '<p class="loading">Todavía no hay eventos cargados</p>';
        }
    } catch (error) {
        lista.innerHTML = '<p class="loading">⚠️ No se pudo conectar con el servidor</p>';
    }
}

// ============================================
// CURSOS PREMIUM
// ============================================

const formCurso = document.getElementById('form-curso');
const cursoSubmitBtn = document.getElementById('curso-submit-btn');
const cursoCancelBtn = document.getElementById('curso-cancel-btn');
const cursoFormTitle = document.getElementById('curso-form-title');

let cursosCache = [];

formCurso.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('c-id').value;
    const nombre = document.getElementById('c-nombre').value.trim();
    const descripcion = document.getElementById('c-descripcion').value.trim();
    const drive_url = document.getElementById('c-drive').value.trim();

    if (!nombre || !drive_url) {
        mostrarEstado('curso-status', 'Nombre y enlace de Drive son obligatorios', 'error');
        return;
    }

    const esEdicion = !!id;
    const url = esEdicion ? `${API_URL}/api/cursos/${id}` : `${API_URL}/api/cursos`;
    const method = esEdicion ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: adminHeaders(),
            body: JSON.stringify({ nombre, descripcion, drive_url })
        });

        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            mostrarEstado('curso-status', esEdicion
                ? `✓ "${nombre}" fue actualizado correctamente`
                : `✓ "${nombre}" fue creado correctamente`, 'success');
            cancelarEdicionCurso();
            cargarCursosAdmin();
            cargarCodigosAdmin();
        } else {
            mostrarEstado('curso-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('curso-status', 'No se pudo conectar con el servidor', 'error');
    }
});

cursoCancelBtn.addEventListener('click', cancelarEdicionCurso);

function cancelarEdicionCurso() {
    formCurso.reset();
    document.getElementById('c-id').value = '';
    cursoFormTitle.textContent = 'Nuevo Curso';
    cursoSubmitBtn.textContent = 'Guardar Curso';
    cursoCancelBtn.style.display = 'none';
}

function editarCurso(id) {
    const curso = cursosCache.find(c => c.id === id);
    if (!curso) return;

    document.getElementById('c-id').value = curso.id;
    document.getElementById('c-nombre').value = curso.nombre;
    document.getElementById('c-descripcion').value = curso.descripcion || '';
    document.getElementById('c-drive').value = curso.drive_url || '';

    cursoFormTitle.textContent = `Editando: ${curso.nombre}`;
    cursoSubmitBtn.textContent = 'Actualizar Curso';
    cursoCancelBtn.style.display = 'inline-block';

    document.querySelectorAll('.admin-form-card')[3].scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function eliminarCurso(id) {
    const curso = cursosCache.find(c => c.id === id);
    const nombre = curso ? curso.nombre : 'este curso';

    if (!confirm(`¿Seguro que querés eliminar "${nombre}"? Se borrarán también sus códigos de acceso.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/cursos/${id}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': getAdminKey() }
        });
        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            mostrarEstado('curso-status', `✓ "${nombre}" fue eliminado`, 'success');
            cargarCursosAdmin();
            cargarCodigosAdmin();
        } else {
            mostrarEstado('curso-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('curso-status', 'No se pudo conectar con el servidor', 'error');
    }
}

async function cargarCursosAdmin() {
    const lista = document.getElementById('cursos-admin-lista');
    try {
        const response = await fetch(`${API_URL}/api/cursos`, { headers: { 'X-API-Key': getAdminKey() } });

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        const json = await response.json();

        if (json.success && json.data.length > 0) {
            cursosCache = json.data;
            lista.innerHTML = json.data.map(c => `
                <div class="admin-list-item">
                    <div class="admin-list-content">
                        <h4>🎓 ${escapeHtml(c.nombre)}</h4>
                        <p>${c.descripcion ? escapeHtml(c.descripcion.substring(0, 120)) + (c.descripcion.length > 120 ? '...' : '') : ''}</p>
                        <p style="font-size:0.8rem; color:#999;">🔗 Enlace privado (solo se entrega con el código)</p>
                    </div>
                    <div class="admin-list-actions">
                        <button class="admin-action-btn btn-editar" onclick="editarCurso(${c.id})">Editar</button>
                        <button class="admin-action-btn btn-eliminar" onclick="eliminarCurso(${c.id})">Eliminar</button>
                    </div>
                </div>
            `).join('');
        } else {
            cursosCache = [];
            lista.innerHTML = '<p class="loading">Todavía no hay cursos cargados</p>';
        }

        llenarSelectCursos();
    } catch (error) {
        console.error(error);
        lista.innerHTML = '<p class="loading">⚠️ No se pudo conectar con el servidor</p>';
    }
}

function llenarSelectCursos() {
    const select = document.getElementById('codigo-curso');
    select.innerHTML = '';

    if (cursosCache.length === 0) {
        select.innerHTML = '<option value="">Primero creá un curso</option>';
        return;
    }

    cursosCache.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nombre;
        select.appendChild(opt);
    });
}

// ============================================
// CÓDIGOS DE ACCESO
// ============================================

const formCodigoAdmin = document.getElementById('form-codigo-admin');

formCodigoAdmin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const curso_id = document.getElementById('codigo-curso').value;
    const nombre_cliente = document.getElementById('codigo-cliente').value.trim();

    if (!curso_id) {
        mostrarEstado('codigo-admin-status', 'Primero creá un curso y seleccionalo', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/codigos`, {
            method: 'POST',
            headers: adminHeaders(),
            body: JSON.stringify({ curso_id: Number(curso_id), nombre_cliente })
        });

        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            const cont = document.getElementById('codigo-generado');
            cont.innerHTML = `
                <p>✅ Código generado${json.data.nombre_cliente ? ' para ' + escapeHtml(json.data.nombre_cliente) : ''}:</p>
                <div class="codigo-chip">${json.data.codigo}</div>
                <p style="font-size:0.85rem; color:#777;">Pasaló por WhatsApp o email al alumno. Lo usa en la sección "Mis Cursos".</p>`;
            cont.style.display = 'block';
            document.getElementById('codigo-cliente').value = '';
            mostrarEstado('codigo-admin-status', 'Código generado', 'success');
            cargarCodigosAdmin();
        } else {
            mostrarEstado('codigo-admin-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('codigo-admin-status', 'No se pudo conectar con el servidor', 'error');
    }
});

function formatFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

let codigosCache = [];

async function cargarCodigosAdmin() {
    const lista = document.getElementById('codigos-admin-lista');
    try {
        const response = await fetch(`${API_URL}/api/codigos`, { headers: { 'X-API-Key': getAdminKey() } });

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        const json = await response.json();

        if (json.success && json.data.length > 0) {
            codigosCache = json.data;
            lista.innerHTML = json.data.map(c => {
                const estadoBadge = c.estado === 'activo'
                    ? '<span class="codigo-estado activo">activo</span>'
                    : '<span class="codigo-estado revocado">revocado</span>';
                return `
                    <div class="admin-list-item">
                        <div class="admin-list-content">
                            <h4><span class="codigo-chip-small">${escapeHtml(c.codigo)}</span></h4>
                            <p><strong>${escapeHtml(c.curso_nombre || '—')}</strong></p>
                            <p>${c.nombre_cliente ? 'Cliente: ' + escapeHtml(c.nombre_cliente) : 'Sin nombre de cliente'}</p>
                            <p style="font-size:0.8rem; color:#999;">Creado: ${formatFecha(c.creado)}${c.usado ? ' · Usado: ' + formatFecha(c.usado) : ''}</p>
                        </div>
                        <div class="admin-list-actions">
                            ${estadoBadge}
                            <button class="admin-action-btn btn-eliminar" onclick="eliminarCodigo(${c.id})">Eliminar</button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            codigosCache = [];
            lista.innerHTML = '<p class="loading">Todavía no hay códigos generados</p>';
        }
    } catch (error) {
        console.error(error);
        lista.innerHTML = '<p class="loading">⚠️ No se pudo conectar con el servidor</p>';
    }
}

async function eliminarCodigo(id) {
    const codigoReg = codigosCache.find(c => c.id === id);
    const codigo = codigoReg ? codigoReg.codigo : '';

    if (!confirm(`¿Revocar y eliminar el código ${codigo}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/codigos/${id}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': getAdminKey() }
        });
        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            mostrarEstado('codigo-admin-status', `✓ Código ${codigo} eliminado`, 'success');
            cargarCodigosAdmin();
        } else {
            mostrarEstado('codigo-admin-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('codigo-admin-status', 'No se pudo conectar con el servidor', 'error');
    }
}

// ============================================
// RECURSOS (material gratis del sitio)
// ============================================

const formRecurso = document.getElementById('form-recurso');
const recursoCancelBtn = document.getElementById('recurso-cancel-btn');
const recursoFormTitle = document.getElementById('recurso-form-title');

let recursosCache = [];

const ETIQUETAS_CATEGORIA = {
    'cursos': '🎓 Cursos y Talleres',
    'libros': '📚 Bibliografía y Libros',
    'imagenes': '🖼️ Galería de Imágenes'
};

async function cargarRecursosAdmin() {
    const lista = document.getElementById('recursos-admin-lista');
    try {
        const response = await fetch(`${API_URL}/api/recursos`);

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        const json = await response.json();

        if (json.success && json.data.length > 0) {
            recursosCache = json.data;
            lista.innerHTML = json.data.map(r => `
                <div class="admin-list-item">
                    <div class="admin-list-content">
                        <h4>${(ETIQUETAS_CATEGORIA[r.categoria] || r.categoria)} · ${escapeHtml(r.titulo)}</h4>
                        <p>${r.descripcion ? escapeHtml(r.descripcion.substring(0, 120)) + (r.descripcion.length > 120 ? '...' : '') : ''}</p>
                        <p style="font-size:0.8rem; color:#999;">🔗 ${escapeHtml(r.url)}</p>
                    </div>
                    <div class="admin-list-actions">
                        <button class="admin-action-btn btn-editar" onclick="editarRecurso(${r.id})">Editar</button>
                        <button class="admin-action-btn btn-eliminar" onclick="eliminarRecurso(${r.id})">Eliminar</button>
                    </div>
                </div>
            `).join('');
        } else {
            recursosCache = [];
            lista.innerHTML = '<p class="loading">Todavía no hay recursos cargados</p>';
        }
    } catch (error) {
        console.error(error);
        lista.innerHTML = '<p class="loading">⚠️ No se pudo conectar con el servidor</p>';
    }
}

formRecurso.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('r-id').value;
    const categoria = document.getElementById('r-categoria').value;
    const titulo = document.getElementById('r-titulo').value.trim();
    const descripcion = document.getElementById('r-descripcion').value.trim();
    const url = document.getElementById('r-url').value.trim();

    if (!titulo || !url) {
        mostrarEstado('recurso-status', 'Título y enlace son obligatorios', 'error');
        return;
    }

    try {
        const body = { categoria, titulo, descripcion, url };
        const method = id ? 'PUT' : 'POST';
        const endpoint = id ? `${API_URL}/api/recursos/${id}` : `${API_URL}/api/recursos`;

        const response = await fetch(endpoint, {
            method,
            headers: adminHeaders(),
            body: JSON.stringify(body)
        });

        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            mostrarEstado('recurso-status', id ? '✓ Recurso actualizado' : '✓ Recurso guardado. Ya se ve en el sitio.', 'success');
            formRecurso.reset();
            document.getElementById('r-id').value = '';
            recursoCancelBtn.style.display = 'none';
            recursoFormTitle.textContent = 'Nuevo Recurso';
            cargarRecursosAdmin();
        } else {
            mostrarEstado('recurso-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('recurso-status', 'No se pudo conectar con el servidor', 'error');
    }
});

function editarRecurso(id) {
    const r = recursosCache.find(x => x.id === id);
    if (!r) return;

    document.getElementById('r-id').value = r.id;
    document.getElementById('r-categoria').value = r.categoria;
    document.getElementById('r-titulo').value = r.titulo;
    document.getElementById('r-descripcion').value = r.descripcion || '';
    document.getElementById('r-url').value = r.url;

    recursoFormTitle.textContent = `Editar Recurso: ${r.titulo}`;
    recursoCancelBtn.style.display = 'inline-block';
    recursoFormTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

recursoCancelBtn.addEventListener('click', () => {
    formRecurso.reset();
    document.getElementById('r-id').value = '';
    recursoCancelBtn.style.display = 'none';
    recursoFormTitle.textContent = 'Nuevo Recurso';
});

async function eliminarRecurso(id) {
    const r = recursosCache.find(x => x.id === id);
    const nombre = r ? r.titulo : '';

    if (!confirm(`¿Eliminar el recurso "${nombre}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/recursos/${id}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': getAdminKey() }
        });
        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            mostrarEstado('recurso-status', '✓ Recurso eliminado', 'success');
            cargarRecursosAdmin();
        } else {
            mostrarEstado('recurso-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('recurso-status', 'No se pudo conectar con el servidor', 'error');
    }
}

// ============================================
// ESTADÍSTICAS
// ============================================

async function cargarEstadisticas() {
    const grid = document.getElementById('estadisticas-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/api/estadisticas`, { headers: { 'X-API-Key': getAdminKey() } });

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        const json = await response.json();

        if (json.success) {
            const s = json.data;
            grid.innerHTML = `
                <div class="estadistica-item"><div class="num">${s.visitas}</div><div class="lbl">👀 Visitas</div></div>
                <div class="estadistica-item"><div class="num">${s.danzas}</div><div class="lbl">💃 Danzas</div></div>
                <div class="estadistica-item"><div class="num">${s.eventos}</div><div class="lbl">📅 Eventos</div></div>
                <div class="estadistica-item"><div class="num">${s.comentariosAprobados}</div><div class="lbl">💬 Comentarios</div></div>
                <div class="estadistica-item"><div class="num">${s.cursos}</div><div class="lbl">🎓 Cursos</div></div>
                <div class="estadistica-item"><div class="num">${s.codigosActivos}</div><div class="lbl">🔑 Códigos activos</div></div>
            `;
        } else {
            grid.innerHTML = '<p class="loading">No se pudieron cargar las estadísticas</p>';
        }
    } catch (error) {
        console.error(error);
        grid.innerHTML = '<p class="loading">⚠️ No se pudo conectar con el servidor</p>';
    }
}

// ============================================
// CONFIGURACIÓN (portada y botón de descarga)
// ============================================

const formConfig = document.getElementById('form-config');

function urlImagenPreview(url) {
    if (!url) return '';
    const m1 = url.match(/[?&]id=([^&]+)/);
    const m2 = url.match(/\/d\/([^/]+)/);
    const id = m1 ? m1[1] : (m2 ? m2[1] : null);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
    return urlSeguraAdmin(url);
}

function actualizarPreviewPortada() {
    const url = document.getElementById('cfg-hero-url').value.trim();
    const preview = document.getElementById('cfg-hero-preview');
    const img = urlImagenPreview(url);

    if (img) {
        preview.style.backgroundImage = `linear-gradient(135deg, rgba(139, 111, 71, 0.35) 0%, rgba(193, 65, 12, 0.25) 100%), url('${img.replace(/'/g, '%27')}')`;
        preview.textContent = '';
    } else {
        preview.style.backgroundImage = '';
        preview.textContent = 'Sin imagen (se usa el degradado)';
    }
}

document.getElementById('cfg-hero-url').addEventListener('input', actualizarPreviewPortada);

async function cargarConfigAdmin() {
    try {
        const response = await fetch(`${API_URL}/api/config`);
        const json = await response.json();

        if (json.success) {
            const cfg = json.data || {};
            document.getElementById('cfg-hero-url').value = cfg.hero_background_url || '';
            document.getElementById('cfg-drive-url').value = cfg.hero_boton_drive_url || '';
            document.getElementById('cfg-drive-texto').value = cfg.hero_boton_drive_texto || '📘 Descargar Curso';
            actualizarPreviewPortada();
        }
    } catch (error) {
        console.error(error);
    }
}

formConfig.addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
        hero_background_url: document.getElementById('cfg-hero-url').value.trim(),
        hero_boton_drive_url: document.getElementById('cfg-drive-url').value.trim(),
        hero_boton_drive_texto: document.getElementById('cfg-drive-texto').value.trim() || '📘 Descargar Curso'
    };

    try {
        const response = await fetch(`${API_URL}/api/config`, {
            method: 'PUT',
            headers: adminHeaders(),
            body: JSON.stringify(body)
        });

        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            mostrarEstado('config-status', '✓ Configuración guardada. Ya se actualizó el sitio.', 'success');
        } else {
            mostrarEstado('config-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('config-status', 'No se pudo conectar con el servidor', 'error');
    }
});

// ============================================
// RESPALDO DE DATOS
// ============================================

async function descargarRespaldo() {
    const status = document.getElementById('respaldo-status');
    status.className = 'form-status';
    status.textContent = 'Generando respaldo...';
    status.style.display = 'block';

    try {
        const response = await fetch(`${API_URL}/api/backup`, { headers: { 'X-API-Key': getAdminKey() } });

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        const json = await response.json();

        if (!json.success) {
            status.className = 'form-status error';
            status.textContent = `Error: ${json.error}`;
            return;
        }

        const contenido = JSON.stringify(json.data, null, 2);
        const blob = new Blob([contenido], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fecha = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        a.href = url;
        a.download = `respaldo-danzas-${fecha}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        status.className = 'form-status success';
        status.textContent = `✓ Respaldo descargado con ${json.data.danzas.length} danzas, ${json.data.eventos.length} eventos, ${json.data.cursos.length} cursos.`;
        setTimeout(() => { status.style.display = 'none'; }, 6000);
    } catch (error) {
        console.error(error);
        status.className = 'form-status error';
        status.textContent = 'No se pudo conectar con el servidor';
    }
}

async function restaurarRespaldo(file) {
    const status = document.getElementById('respaldo-status');

    try {
        const texto = await file.text();
        const datos = JSON.parse(texto);

        if (!datos.danzas && !datos.data) {
            status.className = 'form-status error';
            status.textContent = 'Ese archivo no parece un respaldo válido';
            status.style.display = 'block';
            return;
        }

        if (!confirm('⚠️ Esto REEMPLAZARÁ todos los datos actuales (danzas, eventos, comentarios, cursos, códigos y configuración) por el contenido del respaldo. ¿Continuar?')) {
            return;
        }

        status.className = 'form-status';
        status.textContent = 'Restaurando...';
        status.style.display = 'block';

        const response = await fetch(`${API_URL}/api/restore`, {
            method: 'POST',
            headers: adminHeaders(),
            body: JSON.stringify(datos)
        });

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        const json = await response.json();

        if (json.success) {
            status.className = 'form-status success';
            const r = json.data.restaurados;
            status.textContent = `✓ Respaldo restaurado: ${r.danzas} danzas, ${r.eventos} eventos, ${r.comentarios} comentarios, ${r.cursos} cursos, ${r.codigos} códigos.`;
            setTimeout(() => { status.style.display = 'none'; }, 8000);
            cargarDanzasAdmin();
            cargarEventosAdmin();
            cargarComentariosAdmin();
            cargarCursosAdmin();
            cargarCodigosAdmin();
            cargarConfigAdmin();
        } else {
            status.className = 'form-status error';
            status.textContent = `Error: ${json.error}`;
        }
    } catch (error) {
        console.error(error);
        status.className = 'form-status error';
        status.textContent = 'El archivo no es un JSON válido o no se pudo conectar';
    }
}

const btnDescargarRespaldo = document.getElementById('btn-descargar-respaldo');
const btnRestaurarRespaldo = document.getElementById('btn-restaurar-respaldo');
const inputRespaldo = document.getElementById('input-respaldo');

if (btnDescargarRespaldo) {
    btnDescargarRespaldo.addEventListener('click', descargarRespaldo);
}

if (btnRestaurarRespaldo && inputRespaldo) {
    btnRestaurarRespaldo.addEventListener('click', () => inputRespaldo.click());
    inputRespaldo.addEventListener('change', () => {
        if (inputRespaldo.files && inputRespaldo.files[0]) {
            restaurarRespaldo(inputRespaldo.files[0]);
        }
        inputRespaldo.value = '';
    });
}

// ============================================
// MODERACIÓN DE COMENTARIOS
// ============================================

function escapeHtml(texto) {
    return String(texto || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function cargarComentariosAdmin() {
    const pendientesEl = document.getElementById('comentarios-pendientes-lista');
    const aprobadosEl = document.getElementById('comentarios-aprobados-lista');
    const rechazadosEl = document.getElementById('comentarios-rechazados-lista');

    try {
        const [pendientesRes, aprobadosRes, rechazadosRes] = await Promise.all([
            fetch(`${API_URL}/api/comentarios/pendientes`, { headers: { 'X-API-Key': getAdminKey() } }),
            fetch(`${API_URL}/api/comentarios/aprobados`, { headers: { 'X-API-Key': getAdminKey() } }),
            fetch(`${API_URL}/api/comentarios/rechazados`, { headers: { 'X-API-Key': getAdminKey() } })
        ]);

        if (pendientesRes.status === 401 || aprobadosRes.status === 401 || rechazadosRes.status === 401) {
            manejarNoAutorizado();
            return;
        }

        const pendientes = (await pendientesRes.json()).data || [];
        const aprobados = (await aprobadosRes.json()).data || [];
        const rechazados = (await rechazadosRes.json()).data || [];

        actualizarBadgePendientes(pendientes.length);

        if (pendientes.length === 0) {
            pendientesEl.innerHTML = '<p class="loading">No hay comentarios pendientes. ¡Todo al día!</p>';
        } else {
            pendientesEl.innerHTML = pendientes.map(c => renderComentarioAdmin(c, 'pendiente')).join('');
        }

        if (aprobados.length === 0) {
            aprobadosEl.innerHTML = '<p class="loading">No hay comentarios publicados</p>';
        } else {
            aprobadosEl.innerHTML = aprobados.map(c => renderComentarioAdmin(c, 'aprobado')).join('');
        }

        if (rechazados.length === 0) {
            rechazadosEl.innerHTML = '<p class="loading">No hay comentarios rechazados</p>';
        } else {
            rechazadosEl.innerHTML = rechazados.map(c => renderComentarioAdmin(c, 'rechazado')).join('');
        }
    } catch (error) {
        console.error(error);
        pendientesEl.innerHTML = '<p class="loading">⚠️ No se pudo conectar con el servidor</p>';
        aprobadosEl.innerHTML = '';
        rechazadosEl.innerHTML = '';
    }
}

function renderComentarioAdmin(c, estado) {
    const fecha = new Date(c.fecha).toLocaleString('es-AR', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const acciones = estado === 'pendiente'
        ? `<button class="admin-action-btn btn-aprobar" onclick="aprobarComentario(${c.id})">Aprobar</button>
           <button class="admin-action-btn btn-rechazar" onclick="rechazarComentario(${c.id})">Rechazar</button>`
        : estado === 'aprobado'
            ? `<button class="admin-action-btn btn-rechazar" onclick="rechazarComentario(${c.id})">Rechazar</button>`
            : `<button class="admin-action-btn btn-aprobar" onclick="aprobarComentario(${c.id})">Aprobar</button>`;

    return `
        <div class="admin-list-item">
            <div class="admin-list-content">
                <h4>✍️ ${escapeHtml(c.nombre)}</h4>
                <p>"${escapeHtml(c.mensaje)}"</p>
                <p style="font-size:0.8rem; color:#999;">${fecha}</p>
            </div>
            <div class="admin-list-actions">
                ${acciones}
                <button class="admin-action-btn btn-eliminar" onclick="eliminarComentario(${c.id})">Eliminar</button>
            </div>
        </div>
    `;
}

function actualizarBadgePendientes(cantidad) {
    const badge = document.getElementById('pendientes-badge');
    if (cantidad > 0) {
        badge.textContent = cantidad;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

async function cambiarEstadoComentario(id, estado, etiqueta) {
    try {
        const response = await fetch(`${API_URL}/api/comentarios/${id}/estado`, {
            method: 'PUT',
            headers: adminHeaders(),
            body: JSON.stringify({ estado })
        });

        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            mostrarEstado('comentario-status', `✓ Comentario ${etiqueta}`, 'success');
            cargarComentariosAdmin();
        } else {
            mostrarEstado('comentario-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('comentario-status', 'No se pudo conectar con el servidor', 'error');
    }
}

function aprobarComentario(id) {
    cambiarEstadoComentario(id, 'aprobado', 'aprobado');
}

function rechazarComentario(id) {
    cambiarEstadoComentario(id, 'rechazado', 'rechazado');
}

async function eliminarComentario(id) {
    if (!confirm('¿Seguro que querés eliminar este comentario? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/comentarios/${id}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': getAdminKey() }
        });

        const json = await response.json();

        if (response.status === 401) {
            manejarNoAutorizado();
            return;
        }

        if (json.success) {
            mostrarEstado('comentario-status', '✓ Comentario eliminado', 'success');
            cargarComentariosAdmin();
        } else {
            mostrarEstado('comentario-status', `Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarEstado('comentario-status', 'No se pudo conectar con el servidor', 'error');
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (getAdminKey()) {
        verificarClaveAdmin().then(ok => {
            if (ok) {
                adminLoginOverlay.style.display = 'none';
                iniciarAdmin();
            } else {
                clearAdminKey();
                adminLoginOverlay.style.display = 'flex';
            }
        });
    } else {
        adminLoginOverlay.style.display = 'flex';
    }
});
