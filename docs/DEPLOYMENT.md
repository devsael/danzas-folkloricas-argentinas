# 🚀 Guía de Despliegue - Danzas Folklóricas Argentinas

Guía completa para desplegar el proyecto en producción usando Render (backend) y GitHub Pages (frontend).

## 📋 Pre-requisitos

- Cuenta de GitHub (https://github.com)
- Cuenta de Render (https://render.com)
- Git instalado localmente
- Node.js 18.x instalado (solo para testing local)

## 🔀 Paso 0: Preparar el Repositorio

### 0.1 Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Completa los datos:
   - **Repository name**: `danzas-folklóricas-argentinas`
   - **Description**: "Plataforma educativa sobre danzas folklóricas argentinas"
   - **Public**: ✓ Seleccionar (es importante)
   - **Initialize**: Sin seleccionar (haremos push desde local)
3. Click en "Create repository"

### 0.2 Preparar código localmente

```bash
# Navegar a la carpeta del proyecto
cd danzas-folklóricas-argentinas

# Inicializar git
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit: Proyecto Danzas Folklóricas Argentinas"

# Agregar origin (reemplaza TU-USUARIO)
git remote add origin https://github.com/TU-USUARIO/danzas-folklóricas-argentinas.git

# Push al repositorio
git branch -M main
git push -u origin main
```

---

## 🎯 Paso 1: Desplegar Backend en Render

### 1.1 Crear Web Service en Render

1. Ve a https://render.com/dashboard
2. Si no tienes cuenta, regístrate (recomendado con GitHub)
3. Click en "New +" → "Web Service"
4. Elige la opción "Connect a Repository"
5. Busca y selecciona `danzas-folklóricas-argentinas`

### 1.2 Configurar el servicio

Cuando se abra el formulario de configuración:

```
Name:                      danzas-folklóricas-api
Environment:               Node
Build Command:             npm install && npm run init-db
Start Command:             npm start
Runtime:                   Node 18
Plan:                      Free (Gratuito)
Instance Type:             Available options
Auto-deploy:               Yes
```

**Importante**: En la carpeta raíz, debe haber un archivo `package.json`. Como el nuestro está en `/backend`, necesitamos hacer un pequeño ajuste:

### 1.3 Ajuste: Crear Root package.json (Opcional pero recomendado)

Si quieres evitar problemas, crea un `package.json` en la raíz que apunte al backend:

```bash
# En la raíz del proyecto
cat > package.json << 'EOF'
{
  "name": "danzas-folklóricas-root",
  "version": "1.0.0",
  "scripts": {
    "start": "cd backend && npm start",
    "init-db": "cd backend && npm run init-db"
  }
}
EOF
```

Y agrega a `.gitignore`:
```
node_modules/
backend/node_modules/
backend/danzas.db
```

### 1.4 Environment Variables en Render

En el dashboard de Render, ve a "Environment":
```
NODE_ENV = production
PORT = 3000
```

Render asignará automáticamente el puerto.

### 1.5 Desplegar

1. Haz push de los cambios a GitHub:
```bash
git add package.json .gitignore
git commit -m "Add root package.json for Render deployment"
git push
```

2. En Render, click en "Create Web Service"
3. Espera a que compile (2-5 minutos)
4. Verás un mensaje: "Your service is live on..."
5. **Copia la URL**: `https://danzas-folklóricas-api.onrender.com` (será similar)

### 1.6 Verificar que funciona

```bash
# Desde terminal
curl https://danzas-folklóricas-api.onrender.com/api/health

# Deberías ver:
# {"status":"ok","timestamp":"2025-09-06T..."}
```

---

## 🌐 Paso 2: Desplegar Frontend en GitHub Pages

### 2.1 Habilitar GitHub Pages

1. Ve a tu repositorio: https://github.com/TU-USUARIO/danzas-folklóricas-argentinas
2. Settings → Pages
3. En "Source", elige:
   - Branch: `main`
   - Folder: `/frontend` (⚠️ IMPORTANTE)
4. Click en "Save"

GitHub Pages comenzará a construir. Espera 1-2 minutos.

### 2.2 Actualizar URL de API en Frontend

Ahora necesitas actualizar `frontend/script.js` con la URL real de Render:

**En `frontend/script.js` (línea ~13):**

```javascript
// Cambiar de:
const API_URL = 'https://tu-backend.onrender.com';

// A tu URL real, por ejemplo:
const API_URL = 'https://danzas-api-1234.onrender.com';
```

Luego hace commit y push:

```bash
git add frontend/script.js
git commit -m "Update API URL to production Render endpoint"
git push
```

### 2.3 Acceder al sitio

Después de 2-3 minutos, tu sitio estará disponible en:

```
https://TU-USUARIO.github.io/danzas-folklóricas-argentinas/
```

Visita esa URL en tu navegador. ¡Debería funcionar!

### 2.4 Verificar Conexión

En el sitio:
1. Mira abajo a la derecha (footer)
2. Debe decir "API Status: ✓ Conectado"
3. Las danzas, eventos y comentarios deben cargar

---

## 🔧 Paso 3: Configuración Avanzada (Opcional)

### 3.1 CORS en Render (Importante)

Si tienes problemas de CORS, actualiza `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://TU-USUARIO.github.io' // GitHub Pages
  ],
  credentials: true
}));
```

Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub.

Luego:
```bash
git add backend/server.js
git commit -m "Update CORS for production"
git push
```

Render redesplegará automáticamente.

### 3.2 Dominio Personalizado (Opcional)

En Render, puedes agregar un dominio personalizado:

1. En el servicio, ve a "Settings"
2. En "Custom Domain", agrega tu dominio
3. Sigue las instrucciones para actualizar DNS

---

## 📊 Paso 4: Monitoreo y Mantenimiento

### 4.1 Ver Logs en Render

1. En dashboard de Render, selecciona tu servicio
2. Click en "Logs"
3. Verás todos los errores y eventos

### 4.2 Reiniciar Servicio

Si algo falla:
1. En dashboard, click en tu servicio
2. Arriba a la derecha, "Manual Deploy"
3. Click en "Deploy"

### 4.3 Hacer Cambios Localmente

Para actualizar datos o código:

```bash
# Cambios locales
# ... edita archivos ...

# Commit y push
git add .
git commit -m "Descripción del cambio"
git push

# Automáticamente:
# - GitHub Pages redesplegará el frontend
# - Render redesplegará el backend
```

---

## ⚠️ Solución de Problemas

### Problema: "Cannot GET /" en GitHub Pages

**Solución**: 
- GitHub Pages necesita que especifiques el folder correcto
- Settings → Pages → Source → Folder: `/frontend`
- Espera 2-3 minutos

### Problema: "API Status: ✗ Sin conexión"

**Solución**:
1. Verifica que Render está desplegado: visita `https://tu-api.onrender.com/api/health`
2. Verifica que `frontend/script.js` tiene la URL correcta
3. Verifica CORS en `backend/server.js`
4. Abre Console (F12) en tu navegador y busca errores

### Problema: Render dice "Your service is loading..."

**Causa**: Con plan gratuito, Render pone en sleep el servidor.
**Solución**: 
- Visita la URL del sitio web - esto despertará el servidor
- Espera 30-60 segundos en la primera visita

### Problema: Base de datos vacía después del deploy

**Solución**:
- Render ejecuta `npm run init-db` en cada deploy
- Los datos se reinician
- Para datos persistentes, considera PostgreSQL de Render

---

## 🔄 Workflow de Desarrollo

Después del despliegue inicial, este es tu flujo:

```bash
# 1. Cambios locales
code frontend/index.html  # Edita HTML
code frontend/script.js   # Edita JavaScript
code backend/server.js    # Edita API

# 2. Test localmente (opcional)
cd backend
npm install
npm run init-db
npm start  # En otra terminal

# 3. Frontend local
cd frontend
python -m http.server 8000

# 4. Cuando estés satisfecho, hace commit
git add .
git commit -m "Feature: Agregar nueva danza"
git push

# ¡Automáticamente se despliega en producción!
```

---

## 📱 Verificación Final

Antes de dar por terminado el despliegue:

- [ ] Frontend carga correctamente
- [ ] API Status muestra "Conectado"
- [ ] Se cargan las danzas
- [ ] Se cargan los eventos
- [ ] Puedo escribir comentarios
- [ ] Los comentarios se guardan
- [ ] El sitio es responsive en mobile
- [ ] Los videos de YouTube cargan

---

## 🎉 ¡Felicidades!

Tu plataforma de Danzas Folklóricas Argentinas está en producción.

### URLs Finales

- **Frontend**: `https://tu-usuario.github.io/danzas-folklóricas-argentinas/`
- **Backend**: `https://danzas-folklore-api.onrender.com`
- **Repositorio**: `https://github.com/tu-usuario/danzas-folklóricas-argentinas`

### Próximos Pasos

1. Comparte el enlace con otros
2. Agrega más danzas y eventos
3. Mejora el diseño según feedback
4. Considera un dominio personalizado
5. Migra a PostgreSQL si crece mucho

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Render
2. Abre Console (F12) en el navegador
3. Busca en la documentación de Render y GitHub Pages
4. Crea un issue en GitHub

---

**¡A danzar y a compartir cultura! 🎭**
