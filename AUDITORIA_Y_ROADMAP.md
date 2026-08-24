# 📋 AUDITORÍA Y ROADMAP — Danzas Folklóricas Argentinas

**Fecha:** 2025-08-24  
**Estado actual:** Producción funcional (GitHub Pages + Render)  
**Último deploy:** `be86dbf` (Fix hero subtitle + admin edit inline + filtros)

---

## ✅ LO QUE YA FUNCIONA (Producción verificada)

### 🎯 Core Features
- **Danzas**: Catálogo completo (paginación, búsqueda, modal con video/imagen, badge carácter)
- **Eventos**: CRUD admin + lista pública con paginación
- **Comentarios**: Libro de visitas con moderación (pendiente/aprobado/rechazado)
- **Recursos**: CRUD admin completo + vista pública con **filtros por categoría** (Ver todos / Música / Cursos / Libros / Imágenes)
- **Música (audio)**: Categoría `audio` en Recursos → reproductor `<audio>` + **descarga proxy** (oculta URL Drive) + agrupación por año
- **Cursos**: CRUD admin + venta por códigos (generar/canjear) + "Mis Cursos"
- **Configuración**: Portada (imagen + botón Drive), **Colaboración/Cafecito** (URL + texto), estadísticas
- **Admin**: Login por clave (`ADMIN_KEY`), tabs: Danzas, Eventos, Comentarios, Cursos, Códigos, Recursos, Config, Backup/Restore

### 🔐 Seguridad / Auth
- Admin key en header `X-API-Key` (sessionStorage en frontend, variable `ADMIN_KEY` en Render)
- Rate limiting en endpoints públicos (visitas, audio, download)
- Validación de IDs, sanitización de URLs (`urlSegura`), escape HTML

### 🎵 Audio / Streaming
- **Streaming proxy** `/api/audio/:fileId` → evita bloqueo CORS/Referer de Drive
- **Descarga proxy** `/api/recursos/:id/download` → `Content-Disposition: attachment`, oculta URL Drive, maneja página de virus de Drive (`confirm=`)
- Reproductor `<audio controls>` + botón **⏹ Detener** + **un solo audio a la vez** (pausa otros al hacer play)
- Agrupación por año extraída del título (regex `\b(19|20)\d{2}\b`)

### 💰 Monetización (Fase 1 - Cafecito)
- Config `donar_url` + `donar_texto` en admin → botón **🤝 Colaborar** en cada tarjeta de Recursos
- URL validada (`urlSegura` bloquea `javascript:`, `data:`)
- Listo para tu link: `https://cafecito.app/eafolk26`

### 🔧 Dev / Deploy
- **`npm run dev:all`** → levanta backend (3000) + frontend estático (8000) con Node puro (sin Python), mata puertos 3000/8000 con PowerShell fallback, health check a los 3s
- **GitHub Actions** (`.github/workflows/pages.yml`) → deploy automático a GitHub Pages en push a `main`
- **Render** → backend auto-deploy en push a `main` (Free tier, SQLite local en dev, PostgreSQL en prod)
- `scripts/generar-cache.js` → genera `danzas-cache.js` para carga instantánea + SEO
- `scripts/dev-local.js` → dev server 100% Node (sin Python), mata puertos con PowerShell

### 🗄️ Base de Datos
- **SQLite** (dev) / **PostgreSQL** (Render prod)
- Tablas: `danzas`, `eventos`, `comentarios`, `cursos`, `codigos`, `recursos`, `config`
- Migraciones automáticas al arrancar (`ensureColumn`, `CREATE TABLE IF NOT EXISTS`)

### 🎨 UI / UX
- Diseño responsive, tema folklórico (colores tierra, fuente Georgia/serif)
- Lazy loading imágenes, `object-position` configurable por danza
- Modal danzas con imagen, video, historia, coreografía, región, badge carácter
- Lazy loading imágenes (`IntersectionObserver`)
- Hero configurable (imagen + botón Drive)
- Footer oscuro, sticky nav, hamburger menu mobile
- Tooltips, hints en admin, validaciones visuales

### 📱 SEO
- Meta tags, Open Graph, Twitter Cards, JSON-LD (`CreativeWork`/`MusicRecording`)
- `robots.txt`, `sitemap.xml`, verificación Search Console
- Modal danza con `pushState` → URL `/danza/:id` + meta dinámicos + JSON-LD `MusicRecording`
- `danzas-cache.js` → precarga para SEO + carga instantánea

---

## 🔴 BUGS CONOCIDOS / PENDIENTES MENORES

| # | Área | Descripción | Prioridad |
|---|------|-------------|-----------|
| 1 | Frontend | Filtros "Explorar música" solo aparecen si hay recursos en esa categoría (en prod hay 5 items totales, puede no verse) | Baja |
| 2 | Admin | Edición inline (lápiz) funciona pero no hay feedback visual "guardando..." | Baja |
| 3 | Audio | Botón **Detener** resetea a 0 pero no oculta el reproductor | Baja |
| 4 | Admin | Formulario Recursos: vista previa URL no se actualiza al cambiar categoría si URL ya cargada | Baja |
| 4 | Admin | No hay confirmación "¿Seguro?" al cancelar edición con cambios sin guardar | Baja |

---

## 🟡 MEJORAS PRIORITARIAS (Próximas 2-4 semanas)

### 1. Admin — Replicar tabla mejorada a Danza / Eventos / Cursos
- [ ] Migrar Danza, Eventos, Cursos a tabla con búsqueda/orden/paginación/inline edit
- [ ] Vista previa Drive en tabla (miniatura + botón "Abrir")
- [ ] Formulario slide-in (Nuevo/Editar) consistente
- [ ] Eliminar `onclick="editarX(id)"` inline → delegación en `document`

### 2. SEO — Sitemap dinámico + Páginas `/danza/:id`
- [ ] `scripts/generar-cache.js` → genera `sitemap.xml` con URLs `/danza/:id`
- [ ] Página estática `danza.html` (o ruta SPA) que carga danza por ID + meta/JSON-LD
- [ ] `pushState` ya implementado → solo falta página rastreable por Google

### 3. Plan de Estudio (Modelo + UI)
- [ ] Tabla `planes` (nivel, título, descripción, orden, unidades JSON)
- [ ] Admin: CRUD planes + arrastrar para reordenar unidades
- [ ] Público: Acordeón por nivel → unidades → danzas + recursos asociados
- [ ] "Marcar como vista" (localStorage o BD si hay login futuro)

### 4. Admin UX — Pulido general
- [ ] Búsqueda global (input arriba a la derecha, filtra en todas las tablas)
- [ ] Orden por columnas click en header (ya en Recursos, replicar)
- [ ] Paginación server-side (hoy trae todo y pagina en cliente)
- [ ] Subida múltiple a Drive (arrastrar varios → crea varios recursos)
- [ ] Logs de auditoría (quién/qué/cuándo)

---

## 🟢 IDEAS FUTURAS (Backlog)

### Monetización Fase 2 — "Colección Premium"
- Pack anual (ZIP MP3 + PDF guía) → Mercado Pago Checkout Pro → webhook → URL firmada (R2, expira 24h)
- Cloudflare R2 (gratis 10 GB/mes) para almacenar MP3s propios

### Monetización Fase 3 — Suscripción
- Acceso ilimitado streaming + descarga mientras paga mensual
- Stripe / MP Suscripciones + JWT + middleware `requireSubscription`

### Comunidad / Social
- Login usuarios (email/password o magic link)
- Perfil alumno: progreso plan, favoritos, certificados
- Comentarios en danzas (responder, like)
- Notificaciones (nuevo recurso, evento próximo)

### Accesibilidad / i18n
- `alt` en todas las imágenes, `aria-label` en botones icono
- Contraste WCAG AA
- Inglés / Portugués (opcional)

### Performance
- Service Worker + Cache API (offline first para danzas-cache)
- Compresión Brotli/Gzip en Render (ya activado por defecto)
- Preload hero image, `font-display: swap`

---

## 📁 ESTRUCTURA DE ARCHIVOS CLAVE

```
├── backend/
│   ├── server.js          # Express API (1179 líneas) — endpoints, rate limit, proxy audio/download
│   ├── db.js              # Capa DB (SQLite/Postgres, migraciones auto)
│   ├── ddl.js             # CREATE TABLE statements
│   └── init-db.js         # Seed inicial
├── frontend/
│   ├── index.html         # SPA (1000+ líneas) — hero, danzas, eventos, recursos, modal, etc.
│   ├── script.js          # Lógica SPA (1180 líneas) — danzas, eventos, recursos, modal, audio, SEO, pushState
│   ├── admin.html         # Panel admin (573 líneas) — tabs, formularios, tablas
│   ├── admin.js           # Lógica admin (1616 líneas) — CRUD tabs, tablas, formularios, stats
│   ├── styles.css         # Estilos (1620+ líneas) — tema, responsive, admin tables, modales
│   ├── danzas-cache.js    # Datos precargados (SEO + carga instantánea)
│   └── scripts/
│       ├── generar-cache.js   # Genera danzas-cache.js + (futuro) sitemap.xml
│       └── dev-local.js       # Dev server 100% Node (backend + frontend estático)
├── scripts/
│   └── dev-local.js           # (duplicado en frontend/scripts/ — unificar)
├── .github/workflows/pages.yml # Deploy GitHub Pages
└── package.json               # Scripts: start, dev, init-db, generar-cache, dev:all
```

---

## 🧪 TESTS AUTOMÁTICOS (Existentes)

| Test | Qué cubre | Cómo correr |
|------|-----------|-------------|
| `test-backend.cjs` | 13 integraciones (health, config, recursos CRUD, streaming, auth) | `node test-backend.cjs` |
| `test-frontend-puro.cjs` | 23 funciones puras (escapeHtml, urlSegura, urlAudioStreaming, audioPorAnioHtml, botonDonar, tarjetas) | `node test-frontend-puro.cjs` |
| `dev-local.js` | Integración completa (backend 3000 + frontend 8000) | `npm run dev:all` |

> **Nota:** Tests son scripts `.cjs` en `C:\Users\TT\AppData\Local\Temp\opencode\` — mover a repo y agregar `npm test` en `package.json`.

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS (Orden sugerido)

1. **Replicar admin tabla a Danza** (mayor impacto visual + usa mucho el admin)
2. **SEO sitemap + página `/danza/:id`** (tráfico orgánico)
3. **Plan de Estudio** (valor diferencial para profes/alumnos)
4. **Admin UX global** (búsqueda, paginación server-side, auditoría)
5. **Monetización Fase 2** (si hay tracción en botón Cafecito)

---

## 📝 NOTAS TÉCNICAS PARA EL EQUIPO

- **API_URL** en `script.js`/`admin.js`: detecta `localhost` → `http://localhost:3000`; sino `https://danzas-folkloricas-api.onrender.com`
- **`danzas-cache.js`** se regenera con `npm run generar-cache` tras cambios en danzas
- **Admin key** en Render: `ADMIN_KEY` (string larga). En dev: `danzas-admin-dev-key-2025`
- **CORS** en `server.js`: permite `localhost:3000`, `localhost:8000`, `devsael.github.io`
- **Rate limits**: visita 60/h, audio 30/min, download 20/min, admin 30/min
- **Drive proxy**: `extraerDriveId()` soporta `uc?id=` y `/file/d/ID/view`
- **Caché**: `danzas-cache.js` inyectado en `index.html` → `window.DANZAS_CACHE`

---

**¿Por cuál arrancamos la próxima sesión?**  
Sugiero: **Admin Danza** (replicar tabla) → impacto inmediato en tu día a día.