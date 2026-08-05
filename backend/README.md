# 🎭 Backend - Danzas Folklóricas Argentinas

Servidor API REST con Node.js + Express para la plataforma de danzas folklóricas.

## 📋 Contenidos

- [Inicio Rápido](#inicio-rápido)
- [Instalación](#instalación)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura de Base de Datos](#estructura-de-base-de-datos)
- [Configuración](#configuración)
- [Solución de Problemas](#solución-de-problemas)

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Inicializar base de datos
npm run init-db

# 3. Iniciar servidor
npm run dev

# El servidor estará en http://localhost:3000
```

Verifica que funciona:
```bash
curl http://localhost:3000/api/health
```

## 💾 Instalación

### Requisitos

- Node.js 18.x o superior
- npm o yarn
- Git

### Pasos de instalación

```bash
# Clonar repositorio (si no lo hiciste)
git clone https://github.com/tu-usuario/danzas-folklóricas-argentinas.git
cd danzas-folklóricas-argentinas/backend

# Instalar dependencias
npm install

# Inicializar base de datos (crea danzas.db con datos de ejemplo)
npm run init-db

# Iniciar servidor en modo desarrollo
npm run dev

# O iniciar en modo producción
npm start
```

## 📜 Scripts Disponibles

### `npm install`
Instala todas las dependencias necesarias (Express, SQLite3, CORS, etc.)

### `npm run dev`
Inicia el servidor en modo desarrollo con auto-reload
```bash
npm run dev
# ✓ Servidor escuchando en puerto 3000
# Cambios en archivos se recargan automáticamente
```

### `npm start`
Inicia el servidor en modo producción (para Render)
```bash
npm start
```

### `npm run init-db`
Inicializa la base de datos SQLite con:
- Estructura de tablas
- Datos de ejemplo (6 danzas, 3 eventos)
```bash
npm run init-db
# ✓ Insertado: Chacarera
# ✓ Insertado: Cueca
# ✓ Insertado: Zamba
# ...
```

## 🗄️ Estructura de Base de Datos

### Tabla: danzas

```sql
CREATE TABLE danzas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  historia TEXT,
  coreografia TEXT,
  video_url TEXT
);
```

**Ejemplo:**
```
id: 1
nombre: Chacarera
region: Noroeste (Salta, Jujuy, Tucumán)
historia: Danza festiva de origen andino...
coreografia: Movimientos circulares, giros...
video_url: https://www.youtube.com/embed/CKG_5PFQIA4
```

### Tabla: eventos

```sql
CREATE TABLE eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  fecha TEXT NOT NULL,
  lugar TEXT,
  descripcion TEXT
);
```

**Ejemplo:**
```
id: 1
titulo: Peña Folklórica Mensual
fecha: 2025-09-06
lugar: Centro Cultural San Miguel, Corrientes
descripcion: Encuentro mensual de danzas folklóricas...
```

### Tabla: comentarios

```sql
CREATE TABLE comentarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  fecha TEXT NOT NULL
);
```

**Ejemplo:**
```
id: 1
nombre: María González
mensaje: Excelente plataforma para aprender...
fecha: 2025-09-06T14:30:45.123Z
```

## ⚙️ Configuración

### Variables de Entorno

El servidor funciona sin variables especiales, pero puedes personalizarlas:

**.env (opcional)**
```bash
NODE_ENV=development
PORT=3000
DB_PATH=./danzas.db
```

Luego actualiza `server.js` si necesitas leer estas variables:
```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

### CORS

En `server.js`, línea ~22, está configurado CORS para:
- `http://localhost:3000` (desarrollo local)
- `http://127.0.0.1:3000` (desarrollo local alternativo)
- `https://tu-usuario.github.io` (GitHub Pages)

Para agregar más orígenes:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://tu-usuario.github.io/danzas-folklóricas-argentinas/',
    'https://tu-dominio.com'  // Agrega tu dominio aquí
  ],
  credentials: true
}));
```

## 🔌 Endpoints Disponibles

### Health Check
```
GET /api/health
```

### Danzas
```
GET    /api/danzas          # Listar todas
GET    /api/danzas/:id      # Obtener una
POST   /api/danzas          # Crear nueva
```

### Eventos
```
GET    /api/eventos         # Listar todos
POST   /api/eventos         # Crear nuevo
```

### Comentarios
```
GET    /api/comentarios     # Listar últimos 50
POST   /api/comentarios     # Crear nuevo
```

Documentación completa: Ver `docs/API.md`

## 🐛 Solución de Problemas

### Error: "Module not found: sqlite3"

**Solución:**
```bash
npm install sqlite3
```

### Error: "Cannot bind to port 3000"

**Causa**: Otro proceso está usando el puerto
**Solución**:
```bash
# Cambiar puerto temporalmente
PORT=3001 npm start

# O matar el proceso que usa 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows
```

### Error: "Database is locked"

**Causa**: Acceso concurrente a SQLite
**Solución**: Cierra todos los servidores y vuelve a iniciar

### El servidor se reinicia constantemente

**Si estás usando `npm run dev`:**
- Asegúrate de que hay un archivo `node_modules/` completo
- Intenta:
```bash
rm -rf node_modules
npm install
npm run dev
```

### Datos no persisten después de reiniciar

**Comportamiento esperado en desarrollo:**
- SQLite puede reiniciarse si algo falla
- Para datos persistentes en producción, usa la opción PostgreSQL de Render

### CORS error al conectar desde frontend

**Error típico:**
```
Access to XMLHttpRequest at 'http://localhost:3000/api/danzas' 
from origin 'http://localhost:8000' has been blocked by CORS policy
```

**Soluciones:**
1. Verifica que `server.js` tiene la URL correcta en `cors()`
2. Asegúrate de que el servidor está corriendo (`npm run dev`)
3. Abre el tab "Network" en DevTools para ver la respuesta

---

## 📊 Desarrollo

### Agregar una nueva tabla

En `init-db.js`:
```javascript
db.run(`
  CREATE TABLE IF NOT EXISTS nuevatabla (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    columna1 TEXT NOT NULL,
    columna2 INTEGER
  )
`);
```

### Agregar un nuevo endpoint

En `server.js`:
```javascript
app.get('/api/nuevaendpoint', async (req, res) => {
  try {
    const datos = await dbAll('SELECT * FROM nuevatabla');
    res.json({ success: true, data: datos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Testing con cURL

```bash
# Listar danzas
curl http://localhost:3000/api/danzas | jq

# Crear comentario
curl -X POST http://localhost:3000/api/comentarios \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","mensaje":"Mensaje de prueba para testing"}'
```

### Testing con Postman

1. Descargar Postman: https://www.postman.com/downloads/
2. Importar colección (si la tienes)
3. O crear requests manualmente

---

## 🚢 Despliegue en Render

Ver `docs/DEPLOYMENT.md` para instrucciones completas.

**Resumen:**
1. Asegúrate que `backend/package.json` esté actualizado
2. Push a GitHub
3. Crea Web Service en Render
4. Render ejecutará `npm install && npm run init-db && npm start`

---

## 📚 Recursos

- Documentación de API: `docs/API.md`
- Guía de Despliegue: `docs/DEPLOYMENT.md`
- Express.js: https://expressjs.com
- SQLite3: https://www.sqlite.org

---

## 💡 Tips

1. **Desarrollo rápido**: Usa `npm run dev` para auto-reload
2. **Debugging**: Mira los logs en la terminal
3. **Database Explorer**: Usa herramientas como DB Browser for SQLite
4. **API Testing**: Usa Postman o Insomnia

---

**¡Happy coding! 🎭**
