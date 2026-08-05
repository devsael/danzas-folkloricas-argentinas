# ⚙️ Guía de Configuración - Danzas Folklóricas Argentinas

Guía rápida para configurar el proyecto en tu máquina.

## 🖥️ Windows

### Requisitos
- Git for Windows: https://git-scm.com/download/win
- Node.js: https://nodejs.org/en/ (versión 18.x LTS)

### Instalación

```cmd
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/danzas-folklóricas-argentinas.git
cd danzas-folklóricas-argentinas

# 2. Instalar backend
cd backend
npm install
npm run init-db

# 3. Abrir nueva terminal (Ctrl+Shift+T en muchas terminales)
# 3a. En la primera terminal, iniciar backend
npm run dev

# 4. En la segunda terminal, ir a frontend
cd ../frontend

# 5. Servir frontend (si tienes Python instalado)
python -m http.server 8000

# 6. Abrir navegador
# http://localhost:8000
```

## 🍎 macOS

### Requisitos (usar Homebrew)

```bash
# Instalar Homebrew si no tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node

# Instalar Git (generalmente ya viene)
brew install git
```

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/danzas-folklóricas-argentinas.git
cd danzas-folklóricas-argentinas

# 2. Backend
cd backend
npm install
npm run init-db

# 3. Nueva ventana de Terminal (Cmd+T)
# En terminal 1:
npm run dev

# 4. En terminal 2:
cd ../frontend
python3 -m http.server 8000

# 5. Abrir navegador
# http://localhost:8000
```

## 🐧 Linux (Ubuntu/Debian)

### Requisitos

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade

# Instalar Node.js
sudo apt install nodejs npm

# Instalar Git
sudo apt install git

# Instalar Python (para servir frontend)
sudo apt install python3
```

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/danzas-folklóricas-argentinas.git
cd danzas-folklóricas-argentinas

# 2. Backend
cd backend
npm install
npm run init-db

# 3. Abrir nueva terminal (Ctrl+Alt+T o tmux)
# Terminal 1:
npm run dev

# 4. Terminal 2:
cd ../frontend
python3 -m http.server 8000

# 5. Abrir navegador
# http://localhost:8000
```

---

## 📍 Configuración Post-Instalación

### 1. Conectar Frontend con Backend Localmente

El archivo `frontend/script.js` ya está configurado para `http://localhost:3000` que es lo correcto para desarrollo.

Para verificar:
1. Abre `frontend/script.js`
2. Busca la línea ~13: `const API_URL = ...`
3. Debe decir: `const API_URL = 'http://localhost:3000';`

### 2. Datos de Ejemplo

Cuando ejecutas `npm run init-db`, se cargan automáticamente:
- **6 Danzas folklóricas** (Chacarera, Cueca, Zamba, Tango, Gato, Chamamé)
- **3 Eventos** de ejemplo
- **Base de datos vacía** de comentarios

Puedes agregar más danzas y eventos vía API después.

### 3. Ports Utilizados

- **Backend**: Puerto 3000 (http://localhost:3000)
- **Frontend**: Puerto 8000 (http://localhost:8000)

Si estos puertos están ocupados:

**Backend en puerto diferente:**
```bash
PORT=3001 npm run dev
# Luego actualizar frontend/script.js: API_URL = 'http://localhost:3001'
```

**Frontend en puerto diferente:**
```bash
python -m http.server 8001
# Luego ir a: http://localhost:8001
```

---

## 🔍 Verificación

Después de la instalación, verifica que todo funciona:

### Backend

```bash
# Terminal 1: Dentro de backend/
npm run dev

# Debe mostrar algo como:
# 🎭 Servidor de Danzas Folklóricas escuchando en puerto 3000
# ✓ Conectado a SQLite en: /ruta/a/danzas.db
```

### Frontend

```bash
# Terminal 2: Dentro de frontend/
python -m http.server 8000

# Abre navegador: http://localhost:8000
# Debe mostrar el sitio con las secciones cargadas
```

### API Status

1. Abre http://localhost:8000 en navegador
2. Mira la esquina inferior derecha del footer
3. Debe decir "✓ Conectado" (verde)

### Contenido

Verifica que carga:
- ✓ Danzas en la sección "Danzas"
- ✓ Eventos en la sección "Eventos"
- ✓ Formulario de comentarios funciona
- ✓ Puedes escribir y enviar comentarios

---

## 🐛 Errores Comunes

### Error: "npm not found" o "node not found"

**Causa**: Node.js no está instalado

**Solución**:
1. Descarga desde https://nodejs.org/
2. Instala la versión LTS (18.x)
3. Abre nueva terminal después de instalar
4. Verifica: `node -v` y `npm -v`

### Error: "port 3000 is already in use"

**Solución**:
```bash
# Encontrar qué proceso usa el puerto
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Matar el proceso
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# O cambiar puerto:
PORT=3001 npm run dev
```

### Error: "Cannot GET /" en navegador

**Causa**: Estás intentando acceder a puerto incorrecto

**Solución**:
- Frontend está en `http://localhost:8000`
- Backend está en `http://localhost:3000`
- Verifica en qué puerto iniciaste el frontend

### Error: "API Status: ✗ Sin conexión"

**Causa**: Backend no está corriendo o está en puerto diferente

**Solución**:
1. Verifica que terminal 1 está ejecutando `npm run dev`
2. Verifica que no hay errores en esa terminal
3. Verifica que `frontend/script.js` tiene URL correcta
4. Abre console (F12) en navegador para ver errores detallados

### Error: "Cannot find module 'express'"

**Causa**: `npm install` no se ejecutó o falló

**Solución**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Próximos Pasos

Después de instalar y verificar que funciona:

1. **Explorar el código**
   - Abre `frontend/index.html` - estructura del sitio
   - Abre `frontend/styles.css` - diseño (colores tierra, responsive)
   - Abre `frontend/script.js` - lógica y conexión a API
   - Abre `backend/server.js` - endpoints de la API

2. **Personalizar**
   - Cambia colores en `frontend/styles.css`
   - Edita información en `backend/init-db.js`
   - Agrega nuevas danzas vía API

3. **Desplegar a producción**
   - Ver `docs/DEPLOYMENT.md`
   - Sube a GitHub
   - Despliega en Render y GitHub Pages

---

## 📚 Recursos Útiles

- **Node.js**: https://nodejs.org/docs/
- **Express**: https://expressjs.com/
- **SQLite**: https://www.sqlite.org/docs.html
- **GitHub Pages**: https://pages.github.com/
- **Render**: https://render.com/docs

---

## 💬 Preguntas Frecuentes

**P: ¿Necesito Python instalado?**  
R: Solo si quieres usar `python -m http.server` para el frontend. También puedes usar otras herramientas como `npx http-server`.

**P: ¿Puedo usar `npm run dev` en Windows?**  
R: Sí, pero asegúrate de tener Git Bash o WSL instalado para que funcione el `--watch`.

**P: ¿Dónde se guardan los comentarios?**  
R: En `backend/danzas.db` (archivo SQLite). Se pierde si ejecutas `npm run init-db` de nuevo.

**P: ¿Cómo agrego más danzas?**  
R: En `backend/init-db.js`, agrega al array `danzas`. O usa la API POST `/api/danzas` cuando esté corriendo.

---

**¡Listo para empezar! 🎭**
