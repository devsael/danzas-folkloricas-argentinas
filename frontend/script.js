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

let danzasData = [];
let eventosData = [];

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
    document.getElementById('modal-historia').textContent = danza.historia;
    document.getElementById('modal-coreografia').textContent = danza.coreografia;
    
    const videoSection = document.getElementById('video-section');
    const videoContainer = document.getElementById('modal-video');
    
    if (danza.video_url) {
        videoContainer.innerHTML = `<iframe src="${danza.video_url}" title="Video de ${danza.nombre}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        videoSection.style.display = 'block';
    } else {
        videoSection.style.display = 'none';
    }
    
    modal.classList.add('show');
}

// ============================================
// CARGA DE DATOS DESDE API
// ============================================

// Cargar danzas
async function cargarDanzas() {
    try {
        const response = await fetch(`${API_URL}/api/danzas`);
        const json = await response.json();
        
        if (json.success) {
            danzasData = json.data;
            mostrarDanzas(danzasData);
        } else {
            mostrarError('danzas-lista', 'Error al cargar las danzas');
        }
    } catch (error) {
        console.error('Error al conectar con la API de danzas:', error);
        mostrarError('danzas-lista', 'No se pudo conectar con el servidor');
    }
}

// Buscador de danzas por nombre
const buscadorDanzas = document.getElementById('danzas-busqueda');
if (buscadorDanzas) {
    buscadorDanzas.addEventListener('input', () => {
        const termino = buscadorDanzas.value.trim().toLowerCase();
        if (!termino) {
            mostrarDanzas(danzasData);
            return;
        }
        const filtradas = danzasData.filter(d => d.nombre.toLowerCase().includes(termino));
        mostrarDanzas(filtradas);
    });
}

// Mostrar danzas en la página
function mostrarDanzas(danzas) {
    const lista = document.getElementById('danzas-lista');
    lista.innerHTML = '';
    
    if (danzas.length === 0) {
        lista.innerHTML = '<p class="loading">No hay danzas disponibles</p>';
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
                <p class="danza-description">${danza.historia.substring(0, 100)}...</p>
                <button class="danza-button" onclick="abrirModalDanza(${JSON.stringify(danza).replace(/"/g, '&quot;')})">
                    Ver Detalles
                </button>
            </div>
        `;
        lista.appendChild(card);
    });
}

// Cargar eventos
async function cargarEventos() {
    try {
        const response = await fetch(`${API_URL}/api/eventos`);
        const json = await response.json();
        
        if (json.success) {
            eventosData = json.data;
            mostrarEventos(eventosData);
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
    
    // Ordenar eventos por fecha
    const eventosOrdenados = eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    eventosOrdenados.forEach(evento => {
        const fecha = new Date(evento.fecha);
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
            <div class="evento-lugar">📍 ${evento.lugar}</div>
            <div class="evento-descripcion">${evento.descripcion}</div>
        `;
        lista.appendChild(card);
    });
}

// Cargar comentarios
async function cargarComentarios() {
    try {
        const response = await fetch(`${API_URL}/api/comentarios`);
        const json = await response.json();
        
        if (json.success) {
            mostrarComentarios(json.data);
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
    if (estado === 'online') {
        badge.className = 'status-badge online';
        badge.textContent = '✓ Conectado';
    } else {
        badge.className = 'status-badge offline';
        badge.textContent = '✗ Sin conexión';
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando aplicación de Danzas Folklóricas');
    console.log('📡 Conectando a API:', API_URL);
    
    // Verificar conexión con API
    const apiOk = await verificarAPI();
    
    if (apiOk) {
        // Cargar todos los datos
        await Promise.all([
            cargarDanzas(),
            cargarEventos(),
            cargarComentarios()
        ]);
        console.log('✓ Datos cargados correctamente');
    } else {
        console.warn('⚠️ No se pudo conectar con la API');
        document.getElementById('danzas-lista').innerHTML = 
            '<p class="loading">⚠️ Error de conexión con el servidor. Por favor, intenta más tarde.</p>';
        document.getElementById('eventos-lista').innerHTML = 
            '<p class="loading">⚠️ Error de conexión con el servidor.</p>';
        document.getElementById('comentarios-grid').innerHTML = 
            '<p class="loading">⚠️ Error de conexión con el servidor.</p>';
    }
});

// Recargar comentarios cada 30 segundos
setInterval(cargarComentarios, 30000);

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
