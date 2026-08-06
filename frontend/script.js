// ============================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ============================================

// Cambiar esta URL según dónde esté desplegado el backend
const API_URL = 'https://danzas-folkloricas-api.onrender.com'; // Backend en Render

// ============================================
// PORTADA DE FONDO
// ============================================
// Cambialo cuando quieras: poné la URL de tu imagen de fondo y recargá la página.
// Dejalo vacío ('') para usar el degradado folklórico original.
const HERO_BACKGROUND_URL = '';

const heroPortada = document.querySelector('.hero');
if (heroPortada && HERO_BACKGROUND_URL) {
    heroPortada.style.backgroundImage = `linear-gradient(135deg, rgba(139, 111, 71, 0.6) 0%, rgba(193, 65, 12, 0.45) 100%), url('${HERO_BACKGROUND_URL}')`;
    heroPortada.style.backgroundSize = 'cover';
    heroPortada.style.backgroundPosition = 'center';
    heroPortada.style.backgroundAttachment = 'scroll';
}

// ============================================
// CARÁCTER DE LAS DANZAS
// ============================================

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
    return `<span class="caracter-badge caracter-${clave}">${info.emoji} ${info.label}</span>`;
}

// ============================================
// RECURSOS (GOOGLE DRIVE)
// ============================================
// Configurá acá los enlaces de tu Google Drive. La sección "Recursos" solo
// aparece en la página cuando hay al menos un ítem cargado.
// Cada ítem: { titulo, descripcion, url }
const RECURSOS = {
    cursos: [
        // { titulo: 'Curso de Chacarera', descripcion: 'Material completo con pasos y ejercicios.', url: 'https://drive.google.com/...' },
        // { titulo: 'Curso de Zamba', descripcion: 'Videos y guías del nivel inicial.', url: 'https://drive.google.com/...' }
    ],
    libros: [
        // { titulo: 'Manual de Danzas Folklóricas', descripcion: 'Compendio en PDF con historia y coreografías.', url: 'https://drive.google.com/...' }
    ],
    imagenes: [
        // { titulo: 'Galería de Peñas y Festividades', descripcion: 'Fotos de eventos y presentaciones.', url: 'https://drive.google.com/...' }
    ]
};

// ============================================
// NAVEGACIÓN
// ============================================

const menuToggle = document.getElementById('menuToggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('show');
    });
}

// Estilo de la barra de navegación al hacer scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 30);
    }
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('show');
        // Actualizar enlace activo
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// Actualizar enlace activo según scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// ============================================
// MANEJO DE MODALES
// ============================================

const modal = document.getElementById('modal-danza');
const closeBtn = document.querySelector('.close');

closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.classList.remove('show');
    }
});

// Función para abrir modal
function abrirModalDanza(danza) {
    document.getElementById('modal-titulo').textContent = danza.nombre;
    document.getElementById('modal-region').textContent = danza.region;
    document.getElementById('modal-caracter').innerHTML = badgeCaracter(danza.caracter);
    document.getElementById('modal-historia').textContent = danza.historia || 'No hay información disponible.';
    document.getElementById('modal-coreografia').textContent = danza.coreografia || 'No hay información disponible.';

    const videoSection = document.getElementById('video-section');
    const videoContainer = document.getElementById('modal-video');

    if (danza.video_url) {
        videoContainer.innerHTML = `<iframe src="${danza.video_url}" title="Video de ${danza.nombre}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        videoSection.style.display = 'block';
    } else {
        videoSection.style.display = 'none';
    }

    modal.classList.add('show');
}

// ============================================
// CARGA DE DATOS DESDE API
// ============================================

// ===== DANZAS (con paginación y búsqueda) =====

const DANZAS_LIMIT = 12;
let danzaPage = 1;

async function cargarDanzas(page = 1) {
    const lista = document.getElementById('danzas-lista');
    lista.innerHTML = '<div class="loading">Cargando danzas...</div>';

    const termino = document.getElementById('danzas-busqueda').value.trim();
    let url = `${API_URL}/api/danzas?page=${page}&limit=${DANZAS_LIMIT}`;
    if (termino) {
        url += `&search=${encodeURIComponent(termino)}`;
    }

    try {
        const response = await fetch(url);
        const json = await response.json();

        if (json.success) {
            danzaPage = json.pagination.page;
            mostrarDanzas(json.data);
            renderPaginacion('danzas-paginacion', json.pagination, cargarDanzas);
        } else {
            mostrarError('danzas-lista', 'Error al cargar las danzas');
        }
    } catch (error) {
        console.error('Error al conectar con la API de danzas:', error);
        mostrarError('danzas-lista', 'No se pudo conectar con el servidor');
    }
}

// Buscador de danzas (usa la búsqueda del servidor)
const buscadorDanzas = document.getElementById('danzas-busqueda');
let debounceTimer = null;
if (buscadorDanzas) {
    buscadorDanzas.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => cargarDanzas(1), 350);
    });
}

// Mostrar danzas en la página
function mostrarDanzas(danzas) {
    const lista = document.getElementById('danzas-lista');
    lista.innerHTML = '';

    if (danzas.length === 0) {
        lista.innerHTML = '<p class="loading">No se encontraron danzas</p>';
        return;
    }

    danzas.forEach(danza => {
        const inicial = danza.nombre.trim().charAt(0).toUpperCase();
        const card = document.createElement('div');
        card.className = 'danza-card';
        card.innerHTML = `
            <div class="danza-image"><span class="danza-inicial">${inicial}</span></div>
            <div class="danza-content">
                <h3>${danza.nombre}</h3>
                <span class="danza-region">📍 ${danza.region}</span>
                ${badgeCaracter(danza.caracter)}
                <p class="danza-description">${(danza.historia || '').substring(0, 100)}...</p>
                <button class="danza-button" onclick="abrirModalDanza(${JSON.stringify(danza).replace(/"/g, '&quot;')})">
                    Ver Detalles
                </button>
            </div>
        `;
        lista.appendChild(card);
    });
}

// ===== EVENTOS (con paginación) =====

const EVENTOS_LIMIT = 6;
let eventoPage = 1;

async function cargarEventos(page = 1) {
    const lista = document.getElementById('eventos-lista');
    lista.innerHTML = '<div class="loading">Cargando eventos...</div>';

    try {
        const response = await fetch(`${API_URL}/api/eventos?page=${page}&limit=${EVENTOS_LIMIT}`);
        const json = await response.json();

        if (json.success) {
            eventoPage = json.pagination.page;
            mostrarEventos(json.data);
            renderPaginacion('eventos-paginacion', json.pagination, cargarEventos);
        } else {
            mostrarError('eventos-lista', 'Error al cargar los eventos');
        }
    } catch (error) {
        console.error('Error al conectar con la API de eventos:', error);
        mostrarError('eventos-lista', 'No se pudo conectar con el servidor');
    }
}

// Mostrar eventos en la página
function mostrarEventos(eventos) {
    const lista = document.getElementById('eventos-lista');
    lista.innerHTML = '';

    if (eventos.length === 0) {
        lista.innerHTML = '<p class="loading">No hay eventos próximos</p>';
        return;
    }

    eventos.forEach(evento => {
        const fecha = new Date(evento.fecha + 'T00:00:00');
        const fechaFormato = fecha.toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'evento-card';
        card.innerHTML = `
            <div class="evento-fecha">📅 ${fechaFormato}</div>
            <h3>${evento.titulo}</h3>
            <div class="evento-lugar">📍 ${evento.lugar || ''}</div>
            <div class="evento-descripcion">${evento.descripcion || ''}</div>
        `;
        lista.appendChild(card);
    });
}

// ===== COMENTARIOS (con paginación) =====

const COMENTARIOS_LIMIT = 10;
let comentarioPage = 1;

async function cargarComentarios(page = 1) {
    try {
        const response = await fetch(`${API_URL}/api/comentarios?page=${page}&limit=${COMENTARIOS_LIMIT}`);
        const json = await response.json();

        if (json.success) {
            comentarioPage = json.pagination.page;
            mostrarComentarios(json.data);
            renderPaginacion('comentarios-paginacion', json.pagination, cargarComentarios);
        } else {
            console.error('Error al cargar comentarios');
        }
    } catch (error) {
        console.error('Error al conectar con la API de comentarios:', error);
    }
}

// Mostrar comentarios
function mostrarComentarios(comentarios) {
    const grid = document.getElementById('comentarios-grid');
    grid.innerHTML = '';

    if (comentarios.length === 0) {
        grid.innerHTML = '<p class="loading">Sé el primero en dejar un mensaje</p>';
        return;
    }

    comentarios.forEach(comentario => {
        const fecha = new Date(comentario.fecha);
        const fechaFormato = fecha.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const card = document.createElement('div');
        card.className = 'comentario-card';
        card.innerHTML = `
            <div class="comentario-nombre">✍️ ${comentario.nombre}</div>
            <p class="comentario-mensaje">"${comentario.mensaje}"</p>
            <div class="comentario-fecha">${fechaFormato}</div>
        `;
        grid.appendChild(card);
    });
}

// ============================================
// PAGINACIÓN
// ============================================

function renderPaginacion(containerId, pagination, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!pagination || pagination.totalPages <= 1) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';

    const { page, totalPages } = pagination;

    const crearBtnPagina = (num, activo) => {
        const btn = document.createElement('button');
        btn.className = `page-btn${activo ? ' active' : ''}`;
        btn.textContent = num;
        btn.disabled = activo;
        btn.addEventListener('click', () => callback(num));
        return btn;
    };

    const crearEllipsis = () => {
        const span = document.createElement('span');
        span.className = 'page-ellipsis';
        span.textContent = '…';
        return span;
    };

    const btnPrev = document.createElement('button');
    btnPrev.className = 'page-btn page-arrow';
    btnPrev.textContent = '‹';
    btnPrev.disabled = page <= 1;
    btnPrev.addEventListener('click', () => callback(page - 1));
    container.appendChild(btnPrev);

    let inicio = Math.max(1, page - 2);
    let fin = Math.min(totalPages, inicio + 4);
    inicio = Math.max(1, fin - 4);

    if (inicio > 1) {
        container.appendChild(crearBtnPagina(1, false));
        if (inicio > 2) container.appendChild(crearEllipsis());
    }

    for (let i = inicio; i <= fin; i++) {
        container.appendChild(crearBtnPagina(i, i === page));
    }

    if (fin < totalPages) {
        if (fin < totalPages - 1) container.appendChild(crearEllipsis());
        container.appendChild(crearBtnPagina(totalPages, false));
    }

    const btnNext = document.createElement('button');
    btnNext.className = 'page-btn page-arrow';
    btnNext.textContent = '›';
    btnNext.disabled = page >= totalPages;
    btnNext.addEventListener('click', () => callback(page + 1));
    container.appendChild(btnNext);
}

// ============================================
// RECURSOS
// ============================================

function renderRecursos() {
    const seccion = document.getElementById('recursos');
    const contenedor = document.getElementById('recursos-lista');
    if (!seccion || !contenedor) return;

    const categorias = [
        { clave: 'cursos', titulo: 'Cursos y Talleres', icono: '🎓' },
        { clave: 'libros', titulo: 'Bibliografía y Libros', icono: '📚' },
        { clave: 'imagenes', titulo: 'Galería de Imágenes', icono: '🖼️' }
    ];

    const html = categorias.map(cat => {
        const items = RECURSOS[cat.clave] || [];
        if (items.length === 0) return '';

        const cards = items.map(item => `
            <div class="recurso-card">
                <h4>${item.titulo}</h4>
                ${item.descripcion ? `<p>${item.descripcion}</p>` : ''}
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="recurso-button">Abrir en Google Drive</a>
            </div>
        `).join('');

        return `
            <div class="recursos-categoria">
                <h3>${cat.icono} ${cat.titulo}</h3>
                <div class="recursos-grid">${cards}</div>
            </div>
        `;
    }).join('');

    if (!html.trim()) {
        seccion.style.display = 'none';
        return;
    }

    contenedor.innerHTML = html;
    seccion.style.display = 'block';
}

// ============================================
// LAZY LOADING
// ============================================

function initLazyImages() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                obs.unobserve(img);
            }
        });
    }, { rootMargin: '200px' });

    document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
}

// ============================================
// MANEJO DEL FORMULARIO DE COMENTARIOS
// ============================================

const formComentario = document.getElementById('form-comentario');
const formStatus = document.getElementById('form-status');

formComentario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();

    // Validaciones
    if (!nombre || !mensaje) {
        mostrarEstado('Por favor completa todos los campos', 'error');
        return;
    }

    if (nombre.length < 2 || nombre.length > 100) {
        mostrarEstado('El nombre debe tener entre 2 y 100 caracteres', 'error');
        return;
    }

    if (mensaje.length < 5 || mensaje.length > 1000) {
        mostrarEstado('El mensaje debe tener entre 5 y 1000 caracteres', 'error');
        return;
    }

    // Enviar comentario
    try {
        const response = await fetch(`${API_URL}/api/comentarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, mensaje })
        });

        const json = await response.json();

        if (json.success) {
            mostrarEstado('¡Comentario enviado! Gracias por participar. Tu mensaje será publicado después de la moderación.', 'success');
            formComentario.reset();
            cargarComentarios(1);
        } else {
            mostrarEstado(`Error: ${json.error}`, 'error');
        }
    } catch (error) {
        console.error('Error al enviar comentario:', error);
        mostrarEstado('Error al conectar con el servidor. Intenta más tarde.', 'error');
    }
});

function mostrarEstado(mensaje, tipo) {
    formStatus.className = `form-status ${tipo}`;
    formStatus.textContent = mensaje;
    formStatus.style.display = 'block';

    if (tipo === 'success') {
        setTimeout(() => {
            formStatus.style.display = 'none';
        }, 4000);
    }
}

// ============================================
// VERIFICAR ESTADO DE LA API
// ============================================

async function verificarAPI() {
    try {
        const response = await fetch(`${API_URL}/api/health`, {
            timeout: 5000
        });

        if (response.ok) {
            actualizarEstadoAPI('online');
            return true;
        } else {
            actualizarEstadoAPI('offline');
            return false;
        }
    } catch (error) {
        console.error('Error al verificar API:', error);
        actualizarEstadoAPI('offline');
        return false;
    }
}

function actualizarEstadoAPI(estado) {
    const badge = document.getElementById('api-status');
    if (badge) {
        if (estado === 'online') {
            badge.className = 'status-badge online';
            badge.textContent = '✓ Conectado';
        } else {
            badge.className = 'status-badge offline';
            badge.textContent = '✗ Sin conexión';
        }
    }
}

// ============================================
// BANNER: DESPERTANDO SERVIDOR
// ============================================

function mostrarDespertando() {
    const banner = document.getElementById('wake-banner');
    if (banner) banner.style.display = 'flex';
}

function ocultarDespertando() {
    const banner = document.getElementById('wake-banner');
    if (banner) banner.style.display = 'none';
}

function mostrarErrorConexion() {
    const banner = document.getElementById('wake-banner');
    if (!banner) return;

    banner.innerHTML = `
        <span class="wake-icon">⚠️</span>
        <div class="wake-text">
            <p><strong>No se pudo conectar con el servidor.</strong></p>
            <p>Puede estar despertando (Render Free tarda entre 20 y 60 segundos) o estar momentáneamente caído.</p>
            <button id="btn-reintentar" class="wake-retry">Reintentar ahora</button>
        </div>`;
    banner.style.display = 'flex';

    const btn = document.getElementById('btn-reintentar');
    if (btn) btn.addEventListener('click', () => location.reload());
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando aplicación de Danzas Folklóricas');
    console.log('📡 Conectando a API:', API_URL);

    const footerYear = document.getElementById('footer-year');
    if (footerYear) footerYear.textContent = new Date().getFullYear();

    // Mostrar banner mientras Render despierta en la primera carga
    mostrarDespertando();

    // Recursos (solo se muestra si hay ítems configurados)
    renderRecursos();

    // Lazy loading para imágenes con data-src
    initLazyImages();

    // Verificar conexión con API
    const apiOk = await verificarAPI();

    if (apiOk) {
        // Cargar todos los datos
        await Promise.all([
            cargarDanzas(1),
            cargarEventos(1),
            cargarComentarios(1)
        ]);
        ocultarDespertando();
        console.log('✓ Datos cargados correctamente');
    } else {
        console.warn('⚠️ No se pudo conectar con la API');
        ocultarDespertando();
        mostrarErrorConexion();
        document.getElementById('danzas-lista').innerHTML =
            '<p class="loading">⚠️ Error de conexión con el servidor. Por favor, intenta más tarde.</p>';
        document.getElementById('eventos-lista').innerHTML =
            '<p class="loading">⚠️ Error de conexión con el servidor.</p>';
        document.getElementById('comentarios-grid').innerHTML =
            '<p class="loading">⚠️ Error de conexión con el servidor.</p>';
    }
});

// Recargar comentarios cada 30 segundos
setInterval(() => cargarComentarios(comentarioPage), 30000);

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function mostrarError(elementId, mensaje) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.innerHTML = `<p class="loading">${mensaje}</p>`;
    }
}

// Scroll suave para navegación (ya está en CSS, esto es respaldo)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    });
});
