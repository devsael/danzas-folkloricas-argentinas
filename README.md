# 🎭 Danzas Folklóricas Argentinas

Plataforma web educativa para preservar, difundir y enseñar las danzas folklóricas argentinas: catálogo de danzas con historia, carácter, coreografía y video, plan de estudio, recursos, eventos y libro de visitas con moderación.

## 🌐 Sitio en vivo

- **Frontend**: https://devsael.github.io/danzas-folkloricas-argentinas/
- **Panel de administración**: agregá `/admin.html` a la URL del sitio

## ✨ Características

- 📚 Plan de estudio por niveles (Inicial, Intermedio, Avanzado)
- 💃 Catálogo de danzas con historia, **carácter** (festiva, ceremonial, romántica, guerrera, comunitaria, ritual), coreografía y videos tutoriales
- 🔍 Buscador de danzas (en el servidor) y **paginación** en danzas, eventos y comentarios
- 📦 **Recursos** con enlaces a cursos, libros e imágenes en Google Drive
- 📅 Calendario de eventos y peñas
- 📖 Libro de visitas con moderación de comentarios
- 🔐 Panel admin protegido con clave (`ADMIN_KEY`) y campo de carácter
- ⏱️ Mensaje de espera automático cuando Render despierta (plan Free)
- 🖼️ Lazy loading para imágenes y videos
- 📱 Diseño responsive con footer oscuro profesional

## 🛠️ Stack

- **Frontend**: HTML, CSS, JavaScript (GitHub Pages)
- **Backend**: Node.js, Express (Render)
- **Base de datos**: PostgreSQL en producción (Render Free), SQLite en desarrollo

## 🚀 Desarrollo local

```bash
# Backend (puerto 3000) — sin DATABASE_URL usa SQLite local
cd backend
npm install
npm run init-db
npm start

# Frontend (puerto 8000)
cd frontend
python -m http.server 8000
```

> En `frontend/script.js` y `frontend/admin.js` está la `API_URL` (por defecto apunta a producción).
> En `frontend/script.js`, la constante `RECURSOS` permite cargar los enlaces de Google Drive.

## 🗄️ Migración a PostgreSQL (producción)

```bash
# 1. Crear una base PostgreSQL en Render (New + → PostgreSQL).
# 2. Copiar la "Internal Database URL" como variable DATABASE_URL del Web Service.
# 3. En Render, ejecutar una vez (Shell):
DATABASE_URL="postgres://..." npm run init-db
# 4. El servidor crea las tablas automáticamente si no existen al arrancar.
```

Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para los pasos detallados.

## 📚 Documentación

- [API](docs/API.md)
- [Despliegue](docs/DEPLOYMENT.md)
- [Setup](docs/SETUP.md)

## 📄 Licencia

MIT. Libre para educación y difusión cultural.
