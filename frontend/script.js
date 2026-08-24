// ============================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ============================================

// El frontend usa la API de producción cuando está en GitHub Pages y la API
// local (puerto 3000) cuando se abre desde localhost, para poder probar cambios
// sin tocar el servidor de producción.
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://danzas-folkloricas-api.onrender.com'; // Backend en Render

// ============================================
// PORTADA DE FONDO
// ============================================
// La imagen de portada y el botón de descarga se cargan desde el panel admin
// (pestaña "Configuración") y se guardan en la base de datos. Si no hay nada
// configurado, se usa el degradado folklórico original.

function aplicarPortada(url) {
    const heroPortada = document.querySelector('.hero');
    if (!heroPortada || !url) return;
    const bgUrl = urlParaFondo(url);
    heroPortada.style.backgroundImage = `linear-gradient(135deg, rgba(139, 111, 71, 0.6) 0%, rgba(193, 65, 12, 0.45) 100%), url('${bgUrl}')`;
    heroPortada.style.backgroundSize = 'cover';
    heroPortada.style.backgroundPosition = 'center';
    heroPortada.style.backgroundAttachment = 'scroll';
}

// Convierte un enlace de Drive en una URL de imagen grande para fondo de pantalla
function urlParaFondo(url) {
    const m1 = url.match(/[?&]id=([^&]+)/);
    const m2 = url.match(/\/d\/([^/]+)/);
    const id = m1 ? m1[1] : (m2 ? m2[1] : null);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
    return url;
}

// ============================================
// BOTÓN DE LA PORTADA (Google Drive)
// ============================================
// El botón solo aparece cuando la url está configurada en el panel admin.
// Usá el formato directo de descarga de Drive:
//   https://drive.google.com/uc?export=download&id=TU_ID_DEL_ARCHIVO

function renderBotonDrive(url, texto) {
    const link = document.getElementById('hero-drive-link');
    if (!link || !url) return;
    link.href = url;
    link.textContent = texto || '📘 Descargar Curso';
    link.style.display = 'inline-block';
}

// Config de colaboración ("Colaborar") para la sección Recursos.
// Se carga junto con la configuración del panel admin.
let configDonar = { url: '', texto: '🤝 Colaborar' };

async function cargarConfiguracion() {
    try {
        const response = await fetch(`${API_URL}/api/config`);
        if (!response.ok) return;
        const json = await response.json();
        const cfg = json.data || {};
        aplicarPortada(cfg.hero_background_url);
        renderBotonDrive(cfg.hero_boton_drive_url, cfg.hero_boton_drive_texto);
        configDonar = {
            url: cfg.donar_url || '',
            texto: cfg.donar_texto || '🤝 Colaborar'
        };
    } catch (error) {
        console.warn('No se pudo cargar la configuración:', error);
    }
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

// ============================================
// UTILIDADES DE SEGURIDAD (previenen XSS)
// ============================================

// Escapa texto para insertarlo en HTML de forma segura
function escapeHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Solo permite URLs http/https (bloquea javascript:, data:, etc.)
function urlSegura(url) {
    const u = String(url || '').trim();
    if (/^https?:\/\//i.test(u)) return u;
    return '';
}

// Posiciones válidas de imagen (evita que entren valores raros)
const POSICIONES_IMAGEN = [
    'left top', 'center top', 'right top',
    'left center', 'center center', 'right center',
    'left bottom', 'center bottom', 'right bottom'
];

function posicionImagen(valor) {
    return POSICIONES_IMAGEN.includes(String(valor || '').trim()) ? valor : 'center center';
}

// Convierte cualquier enlace de YouTube al formato embed (el único que acepta
// el iframe): watch?v=, youtu.be, shorts y live. Si no es de YouTube, devuelve
// la URL tal cual (o vacío si no es http/https).
function urlVideoEmbebible(url) {
    const u = String(url || '').trim();
    if (!u) return '';

    const m = u.match(/[?&]v=([^&]+)/);              // youtube.com/watch?v=ID
    const y = u.match(/youtu\.be\/([^?/]+)/);        // youtu.be/ID
    const s = u.match(/(?:shorts|live)\/([^?/]+)/);  // youtube.com/shorts/ID, /live/ID

    const id = m ? m[1] : (y ? y[1] : (s ? s[1] : null));
    if (id) return `https://www.youtube.com/embed/${id}`;

    return /^https?:\/\//i.test(u) ? u : '';
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
    return `<span class="caracter-badge caracter-${clave}">${info.emoji} ${escapeHtml(info.label)}</span>`;
}

// ============================================
// RECURSOS (se administran desde el panel admin)
// ============================================

async function cargarRecursos() {
    const seccion = document.getElementById('recursos');
    const contenedor = document.getElementById('recursos-lista');
    if (!seccion || !contenedor) return;

    let items = [];
    try {
        const response = await fetch(`${API_URL}/api/recursos`);
        const json = await response.json();
        if (json.success) items = json.data || [];
    } catch (error) {
        // si falla la API, no se muestra la sección
    }

    const categorias = [
        { clave: 'cursos', titulo: 'Cursos y Talleres', icono: '🎓', boton: '🎓 Explorar cursos' },
        { clave: 'libros', titulo: 'Bibliografía y Libros', icono: '📚', boton: '📚 Explorar bibliografía' },
        { clave: 'audio', titulo: 'Música y Grabaciones', icono: '🎵', boton: '🎵 Explorar música' },
        { clave: 'imagenes', titulo: 'Galería de Imágenes', icono: '🖼️', boton: '🖼️ Explorar imágenes' }
    ];

    // Solo se muestran las categorías que tienen contenido, y se agrega un
    // filtro "Explorar ..." por cada una (además del "Ver todo").
    const conItems = categorias.filter(cat => items.some(i => i.categoria === cat.clave));
    if (conItems.length === 0) {
        seccion.style.display = 'none';
        return;
    }

    const filtros = `
        <div class="recursos-filtros">
            <button type="button" class="recursos-filtro-btn activo" data-filtro="todos">📂 Ver todo</button>
            ${conItems.map(cat => `<button type="button" class="recursos-filtro-btn" data-filtro="${cat.clave}">${cat.boton}</button>`).join('')}
        </div>
    `;

    const html = conItems.map(cat => {
        const catItems = items.filter(i => i.categoria === cat.clave);

        const cuerpo = cat.clave === 'audio'
            ? audioPorAnioHtml(catItems)
            : `<div class="recursos-grid">${tarjetasDeItems(catItems, cat.clave)}</div>`;

        return `
            <div class="recursos-categoria" data-cat="${cat.clave}">
                <h3>${cat.icono} ${cat.titulo}</h3>
                ${cuerpo}
            </div>
        `;
    }).join('');

    contenedor.innerHTML = filtros + html;
    seccion.style.display = 'block';
}

// Botón de colaboración (si el admin configuró un enlace de donación).
// Se valida la URL: si no es http/https segura, no se muestra nada.
function botonDonar() {
    const href = urlSegura(configDonar.url);
    if (!href) return '';
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="recurso-button recurso-button-donar" title="Apoyar el proyecto">${escapeHtml(configDonar.texto || '🤝 Colaborar')}</a>`;
}

// Tarjeta genérica (cursos, libros, imágenes)
function tarjetasDeItems(items, categoria) {
    const etiquetas = {
        cursos: '📘 Ver curso',
        libros: '📖 Leer documentación',
        imagenes: '🖼️ Ver galería'
    };
    const etiqueta = etiquetas[categoria] || 'Abrir';

    return items.map(item => {
        const href = urlSegura(item.url);
        const esDrive = item.url && (item.url.includes('drive.google.com') || item.url.includes('docs.google.com'));
        const hrefDescarga = (esDrive && item.id) ? urlDescargaProxy(item.id) : href;
        return `
        <div class="recurso-card">
            <h4>${escapeHtml(item.titulo)}</h4>
            ${item.descripcion ? `<p>${escapeHtml(item.descripcion)}</p>` : ''}
            <div class="audio-actions">
                ${botonDonar()}
                ${hrefDescarga ? `<a href="${hrefDescarga}" target="_blank" rel="noopener noreferrer" class="recurso-button recurso-button-descarga">⬇️ ${etiqueta}</a>` : ''}
            </div>
        </div>
    `;
    }).join('');
}

// Convierte cualquier enlace de Google Drive en la URL de streaming del
// backend (Google bloquea reproducir directo desde Drive en páginas ajenas).
function urlAudioStreaming(url) {
    const m1 = url.match(/[?&]id=([^&]+)/);
    const m2 = url.match(/\/d\/([^/]+)/);
    const id = m1 ? m1[1] : (m2 ? m2[1] : null);
    if (id) return `${API_URL}/api/audio/${encodeURIComponent(id)}`;
    return urlSegura(url);
}

// Genera la URL del proxy de descarga del backend para un recurso
function urlDescargaProxy(id) {
    return `${API_URL}/api/recursos/${id}/download`;
}

// Tarjeta de audio con reproductor embebido (memoriza la posición al expandir/colapsar)
function tarjetasDeAudio(items) {
    return items.map(item => {
        const src = urlAudioStreaming(item.url);
        const enlaceDescarga = (item.url && item.url.includes('drive.google.com') && item.id)
            ? urlDescargaProxy(item.id)
            : urlSegura(item.url);
        return `
        <div class="recurso-card recurso-card-audio">
            <h4>${escapeHtml(item.titulo)}</h4>
            ${item.descripcion ? `<p>${escapeHtml(item.descripcion)}</p>` : ''}
            ${src ? `<audio controls preload="metadata" src="${src}"></audio>` : ''}
            <div class="audio-actions">
                <button type="button" class="recurso-stop-btn" title="Detener reproducción">⏹ Detener</button>
                ${botonDonar()}
                ${enlaceDescarga ? `<a href="${enlaceDescarga}" target="_blank" rel="noopener noreferrer" class="recurso-button recurso-button-descarga">⬇️ Descargar</a>` : ''}
            </div>
        </div>
    `;
    }).join('');
}

// Solo un audio a la vez: al reproducir uno, se pausan los demás.
document.addEventListener('play', (e) => {
    const target = e.target;
    if (!target || target.tagName !== 'AUDIO') return;
    const seccion = target.closest('#recursos');
    if (!seccion) return;
    seccion.querySelectorAll('audio').forEach(a => {
        if (a !== target && !a.paused) a.pause();
    });
}, true);

// Botón "Detener": pausa y vuelve al principio.
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.recurso-stop-btn');
    if (!btn) return;
    const card = btn.closest('.recurso-card-audio');
    const audio = card && card.querySelector('audio');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
});

// Filtros "Explorar ..." de la sección Recursos (Ver todo / Música / etc.)
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.recursos-filtro-btn');
    if (!btn) return;
    const seccion = document.getElementById('recursos');
    if (!seccion) return;

    seccion.querySelectorAll('.recursos-filtro-btn').forEach(b => b.classList.toggle('activo', b === btn));
    const filtro = btn.dataset.filtro;
    seccion.querySelectorAll('.recursos-categoria').forEach(bloque => {
        const mostrar = filtro === 'todos' || bloque.dataset.cat === filtro;
        bloque.style.display = mostrar ? '' : 'none';
    });
});

// Agrupa los audios por año. El año va en el título (ej: "Zamba - 2020"),
// así no hace falta cambiar la base de datos. Sin año quedan al final.
function audioPorAnioHtml(items) {
    const grupos = {};
    const sinAnio = [];

    items.forEach(item => {
        const match = String(item.titulo || '').match(/\b(19|20)\d{2}\b/);
        if (match) {
            (grupos[match[0]] = grupos[match[0]] || []).push(item);
        } else {
            sinAnio.push(item);
        }
    });

    const bloques = Object.keys(grupos)
        .sort((a, b) => b.localeCompare(a))
        .map(anio => `
            <div class="audio-anio">
                <h4 class="audio-anio-titulo">🎼 ${anio}</h4>
                <div class="recursos-grid">${tarjetasDeAudio(grupos[anio])}</div>
            </div>
        `);

    if (sinAnio.length) {
        bloques.push(`<div class="recursos-grid">${tarjetasDeAudio(sinAnio)}</div>`);
    }

    return bloques.join('');
}

// ============================================
// CONTADOR DE VISITAS
// ============================================
// Se cuenta una visita por sesión de navegador (sessionStorage), así las
// recargas no inflan el número. El servidor hace el resto del control.
const VISITA_CONTADA_KEY = 'danzas_visita_contada';

function contarVisita() {
    if (sessionStorage.getItem(VISITA_CONTADA_KEY)) return;
    sessionStorage.setItem(VISITA_CONTADA_KEY, '1');
    fetch(`${API_URL}/api/visita`, { method: 'POST' }).catch(() => {});
}

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
// SEO: meta dinámicos + JSON-LD para modal de danza
// ============================================

// Guarda los meta originales al cargar para restaurarlos al cerrar el modal
const metaOriginal = {
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
  ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
  ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
  ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
  ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content') || '',
  twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '',
  twitterTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || '',
  twitterDescription: document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') || '',
  twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '',
  jsonLd: document.querySelector('script[type="application/ld+json"]')?.textContent || ''
};

function actualizarMeta(danza) {
  const baseUrl = window.location.origin;
  const url = `${baseUrl}/danza/${danza.id}`;
  const img = urlSegura(urlImagenParaMostrar(danza.imagen_url)) || '';
  const desc = (danza.historia || `Danza folklórica argentina: ${danza.nombre}. Región: ${danza.region}. Carácter: ${danza.caracter}.`).substring(0, 160);

  // Helper para setear/crear meta
  const setMeta = (selector, attr, value) => {
    let el = document.querySelector(selector);
    if (!el && value) {
      el = document.createElement('meta');
      if (selector.startsWith('meta[property')) el.setAttribute('property', selector.match(/\[property="([^"]+)"/)[1]);
      else el.setAttribute('name', selector.match(/\[name="([^"]+)"/)[1]);
      document.head.appendChild(el);
    }
    if (el) el.setAttribute('content', value || '');
  };

  // Title + meta básicos
  document.title = `${danza.nombre} | Danzas Folklóricas Argentinas`;
  setMeta('meta[name="description"]', 'content', desc);
  setMeta('meta[property="og:title"]', 'content', danza.nombre);
  setMeta('meta[property="og:description"]', 'content', desc);
  setMeta('meta[property="og:image"]', 'content', img);
  setMeta('meta[property="og:url"]', 'content', url);
  setMeta('meta[property="og:type"]', 'content', 'music.song');
  setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
  setMeta('meta[name="twitter:title"]', 'content', danza.nombre);
  setMeta('meta[name="twitter:description"]', 'content', desc);
  setMeta('meta[name="twitter:image"]', 'content', img);

  // JSON-LD MusicRecording
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: danza.nombre,
    description: desc,
    image: img,
    url: url,
    byArtist: {
      '@type': 'MusicGroup',
      name: 'Danzas Folklóricas Argentinas'
    },
    genre: danza.caracter,
    locationCreated: danza.region,
    inLanguage: 'es-AR'
  };
  // Reemplaza/crea el script JSON-LD
  let ld = document.querySelector('script[type="application/ld+json"]');
  if (!ld) {
    ld = document.createElement('script');
    ld.type = 'application/ld+json';
    document.head.appendChild(ld);
  }
  ld.textContent = JSON.stringify(jsonLd);
}

function restaurarMetaOriginal() {
  document.title = metaOriginal.title;
  const setMeta = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', value || '');
  };
  setMeta('meta[name="description"]', metaOriginal.description);
  setMeta('meta[property="og:title"]', metaOriginal.ogTitle);
  setMeta('meta[property="og:description"]', metaOriginal.ogDescription);
  setMeta('meta[property="og:image"]', metaOriginal.ogImage);
  setMeta('meta[property="og:url"]', metaOriginal.ogUrl);
  setMeta('meta[name="twitter:card"]', metaOriginal.twitterCard);
  setMeta('meta[name="twitter:title"]', metaOriginal.twitterTitle);
  setMeta('meta[name="twitter:description"]', metaOriginal.twitterDescription);
  setMeta('meta[name="twitter:image"]', metaOriginal.twitterImage);
  // JSON-LD original
  let ld = document.querySelector('script[type="application/ld+json"]');
  if (ld) ld.textContent = metaOriginal.jsonLd;
}
 
// Elementos del modal
const modal = document.getElementById('modal-danza');
const closeBtn = document.querySelector('.close');
 
function cerrarModal() {
    modal.classList.remove('show');
    document.body.classList.remove('modal-abierto');
    history.pushState(null, '', '/');
    restaurarMetaOriginal();
}
 
closeBtn.addEventListener('click', cerrarModal);

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        cerrarModal();
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        cerrarModal();
    }
});

// Cache de danzas para abrir el modal por id (evita meter JSON en atributos HTML)
const danzasCache = new Map();

// Función para abrir modal
function abrirModalDanza(id) {
    const danza = danzasCache.get(Number(id));
    if (!danza) return;

    document.getElementById('modal-titulo').textContent = danza.nombre;
    document.getElementById('modal-region').textContent = danza.region;
    document.getElementById('modal-caracter').innerHTML = badgeCaracter(danza.caracter);
    document.getElementById('modal-historia').textContent = danza.historia || 'No hay información disponible.';
    document.getElementById('modal-coreografia').textContent = danza.coreografia || 'No hay información disponible.';

    const modalImagen = document.getElementById('modal-imagen');
    const imgUrl = urlSegura(urlImagenParaMostrar(danza.imagen_url));
    if (imgUrl) {
        modalImagen.innerHTML = `<img src="${imgUrl}" alt="${escapeHtml(danza.nombre)}" loading="lazy" style="object-position:${posicionImagen(danza.imagen_posicion)};">`;
        modalImagen.style.display = 'block';
    } else {
        modalImagen.style.display = 'none';
    }

    const videoSection = document.getElementById('video-section');
    const videoContainer = document.getElementById('modal-video');

    const videoUrl = urlSegura(urlVideoEmbebible(danza.video_url));
    if (videoUrl) {
        videoContainer.innerHTML = `<iframe src="${videoUrl}" title="Video de ${escapeHtml(danza.nombre)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        videoSection.style.display = 'block';
    } else {
        videoSection.style.display = 'none';
    }

    modal.classList.add('show');
    document.body.classList.add('modal-abierto');
    history.pushState(null, '', `/danza/${danza.id}`);
    actualizarMeta(danza);
}

// ============================================
// CARGA DE DATOS DESDE API
// ============================================

// ===== DANZAS (con paginación y búsqueda) =====

const DANZAS_LIMIT = 12;
let danzaPage = 1;
let danzasRequestId = 0;
let danzasDesdeCache = false;

async function cargarDanzas(page = 1) {
    const requestId = ++danzasRequestId;
    const lista = document.getElementById('danzas-lista');
    const termino = document.getElementById('danzas-busqueda').value.trim();

    // Primera carga: mostramos la copia guardada al instante (sin esperar a Render).
    // Si la API responde, después se reemplaza con los datos más recientes.
    if (page === 1 && !termino && window.DANZAS_CACHE && !danzasDesdeCache) {
        danzasDesdeCache = true;
        mostrarDanzas(window.DANZAS_CACHE);
        renderPaginacion('danzas-paginacion',
            { page: 1, limit: DANZAS_LIMIT, total: window.DANZAS_CACHE.length, totalPages: 1 },
            cargarDanzas, 'danzas');
    } else {
        lista.innerHTML = '<div class="loading">Cargando danzas...</div>';
    }

    let url = `${API_URL}/api/danzas?page=${page}&limit=${DANZAS_LIMIT}`;
    if (termino) {
        url += `&search=${encodeURIComponent(termino)}`;
    }

    try {
        const response = await fetch(url);
        const json = await response.json();

        if (requestId !== danzasRequestId) return; // respuesta vieja: ignorar

        if (json.success) {
            danzaPage = json.pagination.page;
            mostrarDanzas(json.data);
            renderPaginacion('danzas-paginacion', json.pagination, cargarDanzas, 'danzas');
            const aviso = document.getElementById('danzas-aviso');
            if (aviso) aviso.style.display = 'none';
        } else {
            mostrarError('danzas-lista', 'Error al cargar las danzas');
        }
    } catch (error) {
        if (requestId !== danzasRequestId) return;
        console.error('Error al conectar con la API de danzas:', error);

        // Respaldo: si la API no responde, usamos la copia guardada en el HTML
        if (window.DANZAS_CACHE) {
            const filtradas = termino
                ? window.DANZAS_CACHE.filter(d => (d.nombre || '').toLowerCase().includes(termino.toLowerCase()))
                : window.DANZAS_CACHE;
            mostrarDanzas(filtradas);
            renderPaginacion('danzas-paginacion',
                { page: 1, limit: DANZAS_LIMIT, total: filtradas.length, totalPages: 1 },
                cargarDanzas, 'danzas');
            const aviso = document.getElementById('danzas-aviso');
            if (aviso) aviso.style.display = 'block';
        } else {
            mostrarError('danzas-lista', 'No se pudo conectar con el servidor');
        }
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
        danzasCache.set(danza.id, danza);
        const inicial = (danza.nombre || '?').trim().charAt(0).toUpperCase();
        const imgUrl = urlSegura(urlImagenParaMostrar(danza.imagen_url));
        const posicion = posicionImagen(danza.imagen_posicion);
        const imagenHtml = imgUrl
            ? `<div class="danza-image"><img src="${imgUrl}" alt="${escapeHtml(danza.nombre)}" loading="lazy" style="object-position:${posicion};"></div>`
            : `<div class="danza-image"><span class="danza-inicial">${escapeHtml(inicial)}</span></div>`;
        const card = document.createElement('div');
        card.className = 'danza-card';
        card.innerHTML = `
            ${imagenHtml}
            <div class="danza-content">
                <h3>${escapeHtml(danza.nombre)}</h3>
                <span class="danza-region">📍 ${escapeHtml(danza.region)}</span>
                ${badgeCaracter(danza.caracter)}
                <p class="danza-description">${escapeHtml((danza.historia || '').substring(0, 100))}...</p>
                <button class="danza-button" onclick="abrirModalDanza(${danza.id})">
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
            renderPaginacion('eventos-paginacion', json.pagination, cargarEventos, 'eventos');
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
            <h3>${escapeHtml(evento.titulo)}</h3>
            <div class="evento-lugar">📍 ${escapeHtml(evento.lugar || '')}</div>
            <div class="evento-descripcion">${escapeHtml(evento.descripcion || '')}</div>
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
            renderPaginacion('comentarios-paginacion', json.pagination, cargarComentarios, 'comentarios');
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
            <div class="comentario-nombre">✍️ ${escapeHtml(comentario.nombre)}</div>
            <p class="comentario-mensaje">"${escapeHtml(comentario.mensaje)}"</p>
            <div class="comentario-fecha">${fechaFormato}</div>
        `;
        grid.appendChild(card);
    });
}

// ============================================
// PAGINACIÓN
// ============================================

function renderPaginacion(containerId, pagination, callback, sectionId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!pagination || pagination.totalPages <= 1) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';

    const { page, totalPages } = pagination;

    // Al cambiar de página, subimos al inicio de la sección para que la
    // persona vea el resultado desde arriba (no queda perdido en el medio).
    const irAlInicio = () => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const crearBtnPagina = (num, activo) => {
        const btn = document.createElement('button');
        btn.className = `page-btn${activo ? ' active' : ''}`;
        btn.textContent = num;
        btn.disabled = activo;
        btn.addEventListener('click', () => {
            callback(num);
            irAlInicio();
        });
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
    btnPrev.addEventListener('click', () => {
        callback(page - 1);
        irAlInicio();
    });
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
    btnNext.addEventListener('click', () => {
        callback(page + 1);
        irAlInicio();
    });
    container.appendChild(btnNext);
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

    const btnComentario = formComentario.querySelector('button[type="submit"]');
    if (btnComentario && btnComentario.disabled) return;
    if (btnComentario) btnComentario.disabled = true;

    const nombre = document.getElementById('nombre').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();

    // Validaciones
    if (!nombre || !mensaje) {
        if (btnComentario) btnComentario.disabled = false;
        mostrarEstado('Por favor completa todos los campos', 'error');
        return;
    }

    if (nombre.length < 2 || nombre.length > 100) {
        if (btnComentario) btnComentario.disabled = false;
        mostrarEstado('El nombre debe tener entre 2 y 100 caracteres', 'error');
        return;
    }

    if (mensaje.length < 5 || mensaje.length > 1000) {
        if (btnComentario) btnComentario.disabled = false;
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
    } finally {
        if (btnComentario) btnComentario.disabled = false;
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
// MIS CURSOS (acceso con código premium)
// ============================================

const formCodigo = document.getElementById('form-codigo');
const codigoStatus = document.getElementById('codigo-status');
const cursoDesbloqueado = document.getElementById('curso-desbloqueado');

if (formCodigo) {
    formCodigo.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnCodigo = formCodigo.querySelector('button[type="submit"]');
        if (btnCodigo && btnCodigo.disabled) return;
        if (btnCodigo) btnCodigo.disabled = true;

        const codigoInput = document.getElementById('codigo-input');
        const codigo = codigoInput.value.trim();

        cursoDesbloqueado.style.display = 'none';

        if (!codigo) {
            if (btnCodigo) btnCodigo.disabled = false;
            codigoStatus.className = 'form-status error';
            codigoStatus.textContent = 'Ingresá tu código de acceso';
            codigoStatus.style.display = 'block';
            return;
        }

        codigoStatus.className = 'form-status';
        codigoStatus.textContent = 'Verificando código...';
        codigoStatus.style.display = 'block';

        try {
            const response = await fetch(`${API_URL}/api/mis-cursos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo })
            });

            const json = await response.json();

            if (json.success) {
                const curso = json.data.curso;
                codigoStatus.style.display = 'none';
                const cursoUrl = urlSegura(curso.drive_url);
                if (!cursoUrl) {
                    codigoStatus.className = 'form-status error';
                    codigoStatus.textContent = 'El enlace del curso no está disponible en este momento.';
                    codigoStatus.style.display = 'block';
                } else {
                    cursoDesbloqueado.innerHTML = `
                        <h3>${escapeHtml(curso.nombre)}</h3>
                        ${curso.descripcion ? `<p>${escapeHtml(curso.descripcion)}</p>` : ''}
                        <a href="${cursoUrl}" target="_blank" rel="noopener noreferrer" class="recurso-button">Abrir curso</a>
                    `;
                    cursoDesbloqueado.style.display = 'block';
                }
            } else {
                codigoStatus.className = 'form-status error';
                codigoStatus.textContent = json.error || 'Código inválido';
                codigoStatus.style.display = 'block';
            }
        } catch (error) {
            console.error('Error al verificar código:', error);
            codigoStatus.className = 'form-status error';
            codigoStatus.textContent = 'No se pudo conectar con el servidor. Intenta más tarde.';
            codigoStatus.style.display = 'block';
        } finally {
            if (btnCodigo) btnCodigo.disabled = false;
        }
    });
}

// ============================================
// VERIFICAR ESTADO DE LA API
// ============================================

async function verificarAPI() {
    try {
        const response = await fetch(`${API_URL}/api/health`, {
            signal: AbortSignal.timeout(8000)
        });

        return response.ok;
    } catch (error) {
        console.error('Error al verificar API:', error);
        return false;
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
            <p><strong>No se pudo cargar la página.</strong></p>
            <p>El servidor puede estar despertando. Intentalo de nuevo.</p>
            <button id="btn-reintentar" class="wake-retry">Reintentar</button>
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

    // Empezar siempre desde arriba al cargar/recargar. scrollRestoration='manual'
    // evita que el navegador restaure la posición vieja después de F5 (antes la
    // página quedaba donde estabas, por ejemplo en el libro de visitas).
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (!location.hash) window.scrollTo(0, 0);

    const footerYear = document.getElementById('footer-year');
    if (footerYear) footerYear.textContent = new Date().getFullYear();

    // Mostrar banner mientras Render despierta en la primera carga
    mostrarDespertando();

    // Portada, botón de descarga y configuración de colaboración
    await cargarConfiguracion();

    // Recursos (solo se muestra si hay ítems cargados en el panel admin)
    await cargarRecursos();

    // Contar esta visita (una por sesión)
    contarVisita();

    // Lazy loading para imágenes con data-src
    initLazyImages();

    // Cargar los datos en paralelo. Las danzas se muestran al instante desde la
    // copia guardada y se actualizan si la API responde; si no, queda la copia.
    await Promise.all([
        cargarDanzas(1),
        cargarEventos(1),
        cargarComentarios(1)
    ]);
    ocultarDespertando();
    console.log('✓ Datos cargados correctamente');
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


