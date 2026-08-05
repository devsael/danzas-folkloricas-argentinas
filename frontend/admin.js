// ============================================
// CONFIGURACIÓN
// ============================================
// IMPORTANTE: debe ser la MISMA URL que usás en script.js
const API_URL = 'http://localhost:3000'; // Cambiar cuando despliegues a producción

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
    const historia = document.getElementById('d-historia').value.trim();
    const coreografia = document.getElementById('d-coreografia').value.trim();
    const video_url = document.getElementById('d-video').value.trim();

    if (!nombre || !region) {
        mostrarEstado('danza-status', 'Nombre y región son obligatorios', 'error');
        return;
    }

    const esEdicion = !!id;
    const url = esEdicion ? `${API_URL}/api/danzas/${id}` : `${API_URL}/api/danzas`;
    const method = esEdicion ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: adminHeaders(),
            body: JSON.stringify({ nombre, region, historia, coreografia, video_url })
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
    document.getElementById('d-historia').value = danza.historia || '';
    document.getElementById('d-coreografia').value = danza.coreografia || '';
    document.getElementById('d-video').value = danza.video_url || '';

    danzaFormTitle.textContent = `Editando: ${danza.nombre}`;
    danzaSubmitBtn.textContent = 'Actualizar Danza';
    danzaCancelBtn.style.display = 'inline-block';

    document.querySelector('.admin-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function eliminarDanza(id, nombre) {
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
            lista.innerHTML = json.data.map(d => `
                <div class="admin-list-item">
                    <div class="admin-list-content">
                        <h4>💃 ${d.nombre}</h4>
                        <p><strong>Región:</strong> ${d.region}</p>
                        <p>${(d.historia || '').substring(0, 120)}${d.historia && d.historia.length > 120 ? '...' : ''}</p>
                    </div>
                    <div class="admin-list-actions">
                        <button class="admin-action-btn btn-editar" onclick="editarDanza(${d.id})">Editar</button>
                        <button class="admin-action-btn btn-eliminar" onclick="eliminarDanza(${d.id}, '${d.nombre.replace(/'/g, "\\'")}')">Eliminar</button>
                    </div>
                </div>
            `).join('');
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

async function eliminarEvento(id, titulo) {
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
                            <h4>📅 ${ev.titulo}</h4>
                            <p><strong>${fecha}</strong>${ev.lugar ? ' — ' + ev.lugar : ''}</p>
                            <p>${(ev.descripcion || '').substring(0, 120)}${ev.descripcion && ev.descripcion.length > 120 ? '...' : ''}</p>
                        </div>
                        <div class="admin-list-actions">
                            <button class="admin-action-btn btn-editar" onclick="editarEvento(${ev.id})">Editar</button>
                            <button class="admin-action-btn btn-eliminar" onclick="eliminarEvento(${ev.id}, '${ev.titulo.replace(/'/g, "\\'")}')">Eliminar</button>
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
