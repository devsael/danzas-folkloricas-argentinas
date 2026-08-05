# 🎭 Danzas Folklóricas Argentinas - Plataforma Educativa

Una plataforma web completa e interactiva dedicada a la preservación, difusión y enseñanza de las danzas folklóricas argentinas. Construida con amor por la tradición y la educación cultural.

## 📋 Contenidos

- [Características](#características)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación Local](#instalación-local)
- [Despliegue en Producción](#despliegue-en-producción)
- [Documentación de API](#documentación-de-api)
- [Guía de Uso](#guía-de-uso)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Contribuciones](#contribuciones)

## ✨ Características

### Frontend (GitHub Pages)
- 🏠 **Página Principal Impactante**: Hero section con propósito cultural claro
- 📚 **Plan de Estudio Estructurado**: Niveles progresivos (Inicial, Intermedio, Avanzado)
- 💃 **Catálogo de Danzas**: Fichas detalladas con:
  - Nombre y región de origen
  - Historia y contexto cultural
  - Coreografía básica (descripción y videos)
  - Enlaces a tutoriales en YouTube
- 📅 **Calendario de Eventos**: Peñas, festivales y talleres
- 📖 **Libro de Visitas Interactivo**: Comentarios en tiempo real
- 🎨 **Diseño Folklórico**: Colores tierra, tipografía cálida, iconografía cultural
- 📱 **Responsive Design**: Se adapta perfectamente a cualquier dispositivo
- 🖼️ **Portada Personalizable**: Cambiá la imagen de fondo del hero cuando quieras editando `HERO_BACKGROUND_URL` en `frontend/script.js`

### Backend (Node.js + Express en Render)
- 🔌 **API REST Completa**: Endpoints para danzas, eventos y comentarios
- 🗄️ **Base de Datos SQLite**: Persistencia de datos
- ✅ **Validaciones Robustas**: Campos obligatorios, formatos correctos
- 🔒 **Clave de Administrador**: Danzas y eventos solo se pueden crear, editar o borrar con la clave (`ADMIN_KEY`). Aunque alguien llame a la API directo con `curl`, sin la clave no puede cambiar nada
- 📝 **Moderación de Comentarios**: Los mensajes del Libro de Visitas quedan "pendientes" hasta que el administrador los aprueba desde el panel
- 🔒 **CORS Configurado**: Comunicación segura frontend-backend
- 📊 **Datos de Ejemplo**: Base de datos precargada con danzas y eventos

## 📁 Estructura del Proyecto

```
danzas-folklóricas-argentinas/
│
├── frontend/                    # Sitio estático (GitHub Pages)
│   ├── index.html              # HTML principal
│   ├── styles.css              # Estilos (diseño folklórico)
│   ├── script.js               # Lógica interactiva y API calls
│   └── .gitignore
│
├── backend/                     # Servidor Express (Render)
│   ├── server.js               # Servidor principal
│   ├── init-db.js              # Script de inicialización BD
│   ├── package.json            # Dependencias Node.js
│   ├── .gitignore
│   ├── danzas.db               # Base de datos SQLite (generada)
│   └── README.md               # Documentación backend
│
├── docs/                        # Documentación adicional
│   ├── API.md                  # Referencia de endpoints
│   ├── SETUP.md                # Guía de configuración
│   └── DEPLOYMENT.md           # Guía de despliegue
│
├── README.md                    # Este archivo
└── .gitignore

```

## 🚀 Instalación Local

### Requisitos
- Node.js 18.x o superior
- npm o yarn
- Git

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/danzas-folklóricas-argentinas.git
cd danzas-folklóricas-argentinas
```

### Paso 2: Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# (Opcional) Crear archivo de configuración con tu clave de administrador
# Copiá .env.example a .env y cambiá ADMIN_KEY por una clave secreta larga
cp .env.example .env

# Inicializar base de datos con datos de ejemplo
npm run init-db

# Iniciar servidor (desarrollo)
npm run dev

# O iniciar servidor (producción)
npm start
```

El servidor estará disponible en: `http://localhost:3000`

#### Verificar que funciona
```bash
curl http://localhost:3000/api/health
```

Deberías ver:
```json
{"status":"ok","timestamp":"2025-09-06T14:30:45.123Z"}
```

### Paso 3: Configurar el Frontend

```bash
cd frontend
```

**Opción A: Servir localmente con Python**
```bash
# Python 3
python -m http.server 8000

# Luego abre: http://localhost:8000
```

**Opción B: Usar un servidor HTTP local (Node.js)**
```bash
npx http-server
```

### Paso 4: Conectar Frontend con Backend

En `frontend/script.js`, actualiza la URL de la API (línea ~13):

```javascript
const API_URL = 'http://localhost:3000'; // Desarrollo local
```

### Paso 5: ¡Listo! 

Abre tu navegador en `http://localhost:8000` (o el puerto que hayas usado) y verifica que:
- ✓ Se cargan las danzas
- ✓ Se cargan los eventos
- ✓ Puedes escribir comentarios
- ✓ El API muestra como "Conectado"

## 📦 Despliegue en Producción

### Desplegar Backend en Render (Gratuito)

1. **Crear cuenta en Render.com**
   - Ir a https://render.com
   - Registrarse con GitHub (recomendado)

2. **Crear un nuevo Web Service**
   - Hacer click en "New +"
   - Seleccionar "Web Service"
   - Conectar tu repositorio de GitHub

3. **Configurar el servicio**
   ```
   Name:               danzas-folklóricas-api
   Runtime:            Node
   Build Command:      npm install
   Start Command:      npm start
   Plan:               Free (gratuito)
   ```

4. **Configurar variables de entorno**
   En la sección "Environment", agregar:
   ```
   NODE_ENV = production
   PORT = 3000
   ADMIN_KEY = tu-clave-secreta-larga-y-única
   ```
   ⚠️ `ADMIN_KEY` es la clave que protege el panel de administración. Elegí una larga y no la compartas.

5. **Deploy**
   - Hacer click en "Create Web Service"
   - Esperar a que compile y despliegue (2-3 minutos)
   - Anotar la URL: `https://danzas-folklóricas-api.onrender.com`

**Nota**: Con el plan gratuito de Render, el servidor se pone en "sleep" después de 15 minutos sin actividad. La primera solicitud tardará ~30 segundos. Es normal.

### Desplegar Frontend en GitHub Pages

1. **Crear repositorio en GitHub**
   - Ir a https://github.com/new
   - Nombre: `danzas-folklóricas-argentinas`
   - Hacer público (public)
   - Crear repositorio

2. **Configurar GitHub Pages**
   - Ir a Settings → Pages
   - En "Source", seleccionar "Deploy from a branch"
   - Branch: `main`, folder: `/frontend`
   - Guardar

3. **Actualizar la URL de API en frontend**
   En `frontend/script.js` (línea ~13):
   ```javascript
   const API_URL = 'https://danzas-folklóricas-api.onrender.com'; // URL de Render
   ```

4. **Hacer push**
   ```bash
   git add .
   git commit -m "Desplegar en producción"
   git push origin main
   ```

5. **El sitio estará disponible en**
   ```
   https://tu-usuario.github.io/danzas-folklóricas-argentinas/
   ```

   O si configuraste un dominio personalizado:
   ```
   https://tu-dominio.com
   ```

## 📚 Documentación de API

### Base URL
- **Desarrollo**: `http://localhost:3000`
- **Producción**: `https://danzas-folklóricas-api.onrender.com`

### Endpoints

#### Health Check
```
GET /api/health
```
Verifica que el servidor está activo.

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2025-09-06T14:30:45.123Z"
}
```

### Danzas

#### Listar todas las danzas
```
GET /api/danzas
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Chacarera",
      "region": "Noroeste (Salta, Jujuy, Tucumán)",
      "historia": "Danza festiva de origen andino...",
      "coreografia": "Movimientos circulares, giros de parejas...",
      "video_url": "https://www.youtube.com/embed/..."
    }
  ]
}
```

#### Obtener una danza específica
```
GET /api/danzas/:id
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/danzas/1
```

#### Crear una nueva danza (Admin)
```
POST /api/danzas
Content-Type: application/json

{
  "nombre": "Nueva Danza",
  "region": "Región de origen",
  "historia": "Historia de la danza",
  "coreografia": "Descripción de movimientos",
  "video_url": "URL del video (opcional)"
}
```

### Eventos

#### Listar todos los eventos
```
GET /api/eventos
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "Peña Folklórica Mensual",
      "fecha": "2025-09-06",
      "lugar": "Centro Cultural San Miguel",
      "descripcion": "Encuentro mensual de danzas folklóricas..."
    }
  ]
}
```

#### Crear un evento
```
POST /api/eventos
Content-Type: application/json

{
  "titulo": "Nombre del evento",
  "fecha": "2025-12-25",
  "lugar": "Lugar del evento",
  "descripcion": "Descripción (opcional)"
}
```

**Validaciones:**
- `titulo`: Obligatorio
- `fecha`: Obligatorio, formato YYYY-MM-DD
- `lugar`: Opcional
- `descripcion`: Opcional

### Comentarios

#### Listar comentarios (últimos 50)
```
GET /api/comentarios
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Juan García",
      "mensaje": "Excelente sitio, me encantó aprender sobre...",
      "fecha": "2025-09-06T14:30:45.123Z"
    }
  ]
}
```

#### Crear un comentario
```
POST /api/comentarios
Content-Type: application/json

{
  "nombre": "Tu nombre",
  "mensaje": "Tu mensaje aquí"
}
```

**Validaciones:**
- `nombre`: 2-100 caracteres, obligatorio
- `mensaje`: 5-1000 caracteres, obligatorio

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "nombre": "Tu nombre",
    "mensaje": "Tu mensaje",
    "fecha": "2025-09-06T14:30:45.123Z"
  }
}
```

**Respuesta error (400):**
```json
{
  "success": false,
  "error": "Nombre y mensaje son obligatorios"
}
```

## 🎓 Guía de Uso

### Para Estudiantes

1. **Explorar el Plan de Estudio**
   - Ve a la sección "Plan de Estudio"
   - Identifica tu nivel actual
   - Conoce qué aprenderás en cada nivel

2. **Aprender las Danzas**
   - Haz click en "Explorar Danzas" o ve a la sección "Danzas"
   - Haz click en "Ver Detalles" de cada danza
   - Lee la historia y contexto
   - Mira el video tutorial de YouTube

3. **Conocer Eventos**
   - Consulta la sección "Eventos"
   - Inscríbete en los talleres y peñas que te interesen

4. **Compartir tu Experiencia**
   - Escribe en el "Libro de Visitas"
   - Comparte tus impresiones y aprendizajes

### Para Administradores

> 🔐 Todas las operaciones de escritura y moderación exigen la clave de administrador (`ADMIN_KEY`). En el panel de admin se ingresa una sola vez. Si usás la API directo, enviá la clave en el header `X-API-Key`.

#### Agregar una nueva danza

```bash
curl -X POST http://localhost:3000/api/danzas \
  -H "Content-Type: application/json" \
  -H "X-API-Key: TU-CLAVE" \
  -d '{
    "nombre": "Vidala",
    "region": "Noroeste",
    "historia": "Canto de lamento tradicional...",
    "coreografia": "Movimientos lentos y expresivos...",
    "video_url": "https://www.youtube.com/embed/..."
  }'
```

#### Agregar un evento

```bash
curl -X POST http://localhost:3000/api/eventos \
  -H "Content-Type: application/json" \
  -H "X-API-Key: TU-CLAVE" \
  -d '{
    "titulo": "Festival de Verano",
    "fecha": "2025-12-21",
    "lugar": "Plaza Central, Corrientes",
    "descripcion": "Gran festival con 10 grupos folklóricos"
  }'
```

#### Moderar comentarios

Los comentarios del Libro de Visitas llegan como **pendientes**. En el panel de admin, pestaña "Comentarios", aprobá o rechazá cada mensaje. Solo los aprobados aparecen en el sitio.

```bash
# Ver comentarios pendientes
curl http://localhost:3000/api/comentarios/pendientes -H "X-API-Key: TU-CLAVE"

# Aprobar un comentario (id 7)
curl -X PUT http://localhost:3000/api/comentarios/7/estado \
  -H "Content-Type: application/json" \
  -H "X-API-Key: TU-CLAVE" \
  -d '{"estado": "aprobado"}'
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: Diseño responsivo y variables CSS
- **JavaScript Vanilla**: Sin dependencias externas
- **GitHub Pages**: Hosting gratuito

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web ligero
- **SQLite3**: Base de datos SQL
- **CORS**: Seguridad frontend-backend
- **Render**: Hosting gratuito

### Base de Datos
- **SQLite**: Fácil de usar, sin servidor adicional
- **Tablas**: `danzas`, `eventos`, `comentarios`

## 📝 Licencia

Este proyecto es de código abierto bajo licencia MIT. Úsalo libremente para educación y difusión cultural.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Puedes:

1. Agregar más danzas folklóricas con información detallada
2. Mejorar la documentación
3. Reportar bugs
4. Sugerir nuevas características

Para contribuir:
```bash
git checkout -b feature/tu-mejora
git commit -m "Agrego: descripción de cambio"
git push origin feature/tu-mejora
```

## 📞 Contacto

- **Instructor**: Efra (nombre completo)
- **Ubicación**: San Miguel, Corrientes, Argentina
- **Email**: tu-email@ejemplo.com
- **Teléfono**: Tu número

## 🎭 Propósito Cultural

Este proyecto busca:
- 🌟 Preservar la riqueza cultural de las danzas folklóricas argentinas
- 📚 Educar a nuevas generaciones en la tradición
- 🤝 Crear comunidad alrededor de la danza
- 🌍 Difundir la cultura argentina a nivel mundial

**La danza es la poesía del movimiento. Las danzas folklóricas argentinas son el corazón de nuestra identidad cultural.**

---

Desarrollado con ❤️ y pasión por la tradición  
© 2025 Danzas Folklóricas Argentinas
