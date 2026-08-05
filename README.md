# 🎭 Danzas Folklóricas Argentinas

Plataforma web educativa para preservar, difundir y enseñar las danzas folklóricas argentinas: catálogo de danzas con historia y coreografía, plan de estudio, eventos y libro de visitas con moderación.

## 🌐 Sitio en vivo

- **Frontend**: https://devsael.github.io/danzas-folkloricas-argentinas/
- **Panel de administración**: agregá `/admin.html` a la URL del sitio

## ✨ Características

- 📚 Plan de estudio por niveles (Inicial, Intermedio, Avanzado)
- 💃 Catálogo de danzas con historia, coreografía y videos
- 📅 Calendario de eventos y peñas
- 📖 Libro de visitas con moderación de comentarios
- 🔐 Panel admin protegido con clave (`ADMIN_KEY`)
- 📱 Diseño responsive

## 🛠️ Stack

- **Frontend**: HTML, CSS, JavaScript (GitHub Pages)
- **Backend**: Node.js, Express, SQLite (Render)

## 🚀 Desarrollo local

```bash
# Backend (puerto 3000)
cd backend
npm install
npm run init-db
npm start

# Frontend (puerto 8000)
cd frontend
python -m http.server 8000
```

> En `frontend/script.js` y `frontend/admin.js` está la `API_URL` (por defecto apunta a producción).

## 📚 Documentación

- [API](docs/API.md)
- [Despliegue](docs/DEPLOYMENT.md)
- [Setup](docs/SETUP.md)

## 📄 Licencia

MIT. Libre para educación y difusión cultural.
