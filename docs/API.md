# 📡 Documentación de API - Danzas Folklóricas Argentinas

Referencia completa de todos los endpoints disponibles en la API REST.

## 🔗 Base URL

**Desarrollo**: `http://localhost:3000`  
**Producción**: `https://danzas-folkloricas-api.onrender.com`

## 📋 Tabla de Contenidos

- [Health Check](#health-check)
- [Autenticación de Administrador](#autenticación-de-administrador)
- [Danzas](#danzas)
- [Eventos](#eventos)
- [Comentarios](#comentarios)
- [Cursos Premium](#cursos-premium)
- [Códigos de Acceso](#códigos-de-acceso)
- [Mis Cursos](#mis-cursos)
- [Recursos](#recursos)
- [Configuración](#configuración)
- [Visitas y Estadísticas](#visitas-y-estadísticas)
- [Respaldo y Restauración](#respaldo-y-restauración)
- [Códigos de Estado](#códigos-de-estado)
- [Ejemplos cURL](#ejemplos-curl)
- [Manejo de Errores](#manejo-de-errores)

---

## Health Check

### GET /api/health

Verifica que el servidor está activo y disponible.

**Request:**
```http
GET /api/health HTTP/1.1
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-09-06T14:30:45.123Z"
}
```

**Use Case**: Usar al iniciar la aplicación para verificar disponibilidad de la API.

---

## 🔐 Autenticación de Administrador

Todas las operaciones de **escritura** (crear, editar, borrar danzas y eventos) y de **moderación de comentarios** exigen la clave de administrador. Esto vale también si alguien usa la API directamente con `curl` o Postman: sin la clave no puede cambiar nada.

### Cómo se envía la clave

En el header `X-API-Key`:

```http
X-API-Key: mi-clave-secreta
```

También se acepta `Authorization: Bearer mi-clave-secreta`.

### Dónde se configura la clave

La clave se lee de la variable de entorno `ADMIN_KEY` (en `.env` en desarrollo, o en las variables de entorno de Render en producción).

```env
# backend/.env  (nunca subas este archivo a GitHub)
ADMIN_KEY=poné-acá-una-clave-secreta-larga-y-única
```

> ⚠️ Si `ADMIN_KEY` no está definida, el servidor usa una clave de desarrollo (`danzas-admin-dev-key-2025`) y muestra una advertencia. En producción definí siempre la tuya.

### Respuesta si falta o es incorrecta

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "No autorizado: se requiere la clave de administrador"
}
```

**Endpoints protegidos:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/danzas` | Crear danza |
| PUT | `/api/danzas/:id` | Editar danza |
| DELETE | `/api/danzas/:id` | Borrar danza |
| POST | `/api/eventos` | Crear evento |
| PUT | `/api/eventos/:id` | Editar evento |
| DELETE | `/api/eventos/:id` | Borrar evento |
| GET | `/api/comentarios/pendientes` | Comentarios por moderar |
| GET | `/api/comentarios/aprobados` | Comentarios publicados (para editar/eliminar) |
| GET | `/api/comentarios/rechazados` | Comentarios rechazados |
| PUT | `/api/comentarios/:id/estado` | Aprobar/rechazar comentario |
| DELETE | `/api/comentarios/:id` | Borrar comentario |
| GET | `/api/cursos` | Listar cursos (admin) |
| POST | `/api/cursos` | Crear curso |
| PUT | `/api/cursos/:id` | Editar curso |
| DELETE | `/api/cursos/:id` | Borrar curso (y sus códigos) |
| GET | `/api/codigos` | Listar códigos de acceso |
| POST | `/api/codigos` | Generar código de acceso |
| DELETE | `/api/codigos/:id` | Eliminar/revocar código |
| GET | `/api/recursos` | Listar recursos |
| POST | `/api/recursos` | Crear recurso |
| PUT | `/api/recursos/:id` | Editar recurso |
| DELETE | `/api/recursos/:id` | Borrar recurso |
| PUT | `/api/config` | Actualizar configuración (portada, botón) |
| GET | `/api/estadisticas` | Totales del sitio (visitas, danzas, etc.) |
| GET | `/api/backup` | Descargar respaldo completo |
| POST | `/api/restore` | Restaurar un respaldo |

---

## 💃 Danzas

### GET /api/danzas

Lista las danzas folklóricas con **paginación** y **búsqueda** opcional.

**Request:**
```http
GET /api/danzas?page=1&limit=12&search=cha HTTP/1.1
Host: localhost:3000
Accept: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Chacarera",
      "region": "Noroeste (Salta, Jujuy, Tucumán)",
      "caracter": "festiva",
      "historia": "Danza festiva de origen andino que representa la cosecha y la alegría...",
      "coreografia": "Movimientos circulares, giros de parejas, palmoteos rítmicos...",
      "video_url": "https://www.youtube.com/embed/CKG_5PFQIA4",
      "imagen_url": "https://drive.google.com/thumbnail?id=1AbC123xyz&sz=w800"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 6,
    "totalPages": 1
  }
}
```

**Parámetros de URL:**
- `page` (número) - Página a consultar [opcional, default 1]
- `limit` (número) - Ítems por página [opcional, default 12, máx 50]
- `search` (string) - Busca por nombre (case-insensitive) [opcional]

**Paginación**: Activa. El objeto `pagination` informa `page`, `limit`, `total` y `totalPages`.
**Ordenamiento**: Alfabético por nombre (ignorando mayúsculas/minúsculas)

---

### GET /api/danzas/:id

Obtiene los detalles de una danza específica.

**Request:**
```http
GET /api/danzas/1 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Chacarera",
    "region": "Noroeste (Salta, Jujuy, Tucumán)",
    "historia": "Danza festiva de origen andino que representa la cosecha y la alegría. Es una danza de parejas con movimientos alegres y energéticos que celebran el trabajo en el campo.",
    "coreografia": "Movimientos circulares, giros de parejas, palmoteos rítmicos, pasos alternados. Se ejecuta en tiempo de 6/8.",
    "video_url": "https://www.youtube.com/embed/CKG_5PFQIA4"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Danza no encontrada"
}
```

**Parámetros de URL:**
- `id` (número) - ID de la danza [requerido]

---

### POST /api/danzas

Crea una nueva danza en la base de datos. 🔒 **Requiere clave de administrador**

**Request:**
```http
POST /api/danzas HTTP/1.1
Host: localhost:3000
Content-Type: application/json
X-API-Key: mi-clave-secreta

{
  "nombre": "Vidala",
  "region": "Noroeste",
  "caracter": "ritual",
  "historia": "Composición musical de carácter triste y elegíaco de origen colonial español con influencia indígena. Expresión de dolor, pena y nostalgia.",
  "coreografia": "Movimientos lentos, ondulantes, expresivos. Sin parejas. Generalmente cantada.",
  "video_url": "https://www.youtube.com/embed/..."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "nombre": "Vidala",
    "region": "Noroeste",
    "caracter": "ritual",
    "historia": "Composición musical de carácter triste...",
    "coreografia": "Movimientos lentos, ondulantes...",
    "video_url": "https://www.youtube.com/embed/..."
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Nombre y región son obligatorios"
}
```

**Response (400 Duplicate):**
```json
{
  "success": false,
  "error": "UNIQUE constraint failed: danzas.nombre"
}
```

**Parámetros del Body:**
- `nombre` (string, 1-200) - Nombre de la danza [requerido]
- `region` (string, 1-200) - Región de origen [requerido]
- `caracter` (string) - Carácter: `festiva`, `ceremonial`, `romántica`, `guerrera`, `comunitaria` o `ritual` [opcional, default `festiva`]
- `historia` (string, 0-2000) - Historia y contexto [opcional]
- `coreografia` (string, 0-2000) - Descripción de coreografía [opcional]
- `video_url` (string, 0-500) - URL de video (YouTube embed) [opcional]
- `imagen_url` (string, 0-500) - URL de imagen pública (por ej. Google Drive thumbnail) [opcional]

**Validaciones:**
- Nombre debe ser único
- Ambos campos requeridos deben estar presentes

---

## 📅 Eventos

### GET /api/eventos

Obtiene los eventos con **paginación**, ordenados por fecha descendente.

**Request:**
```http
GET /api/eventos?page=1&limit=6 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "titulo": "Festival de Danzas de la Mesopotamia",
      "fecha": "2025-10-12",
      "lugar": "Plaza Pública, Corrientes",
      "descripcion": "Festival anual con presentaciones de grupos folklóricos, talleres gratuitos y venta de artesanías tradicionales."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 6,
    "total": 3,
    "totalPages": 1
  }
}
```

**Parámetros de URL:**
- `page` (número) - Página a consultar [opcional, default 1]
- `limit` (número) - Ítems por página [opcional, default 6, máx 50]

**Ordenamiento**: Por fecha descendente (próximos eventos primero)

---

### POST /api/eventos

Crea un nuevo evento.

**Request:**
```http
POST /api/eventos HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "titulo": "Taller de Zamba Romántica",
  "fecha": "2025-11-08",
  "lugar": "Centro Cultural, Corrientes",
  "descripcion": "Aprende los movimientos y la sensibilidad de la Zamba. Para nivel intermedio."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "titulo": "Taller de Zamba Romántica",
    "fecha": "2025-11-08",
    "lugar": "Centro Cultural, Corrientes",
    "descripcion": "Aprende los movimientos y la sensibilidad de la Zamba..."
  }
}
```

**Response (400 Bad Request - Campos Faltantes):**
```json
{
  "success": false,
  "error": "Título y fecha son obligatorios"
}
```

**Response (400 Bad Request - Formato de Fecha):**
```json
{
  "success": false,
  "error": "Formato de fecha incorrecto (use YYYY-MM-DD)"
}
```

**Parámetros del Body:**
- `titulo` (string, 1-200) - Título del evento [requerido]
- `fecha` (string, formato YYYY-MM-DD) - Fecha del evento [requerido]
- `lugar` (string, 0-200) - Lugar del evento [opcional]
- `descripcion` (string, 0-1000) - Descripción [opcional]

**Validaciones:**
- Título y fecha son obligatorios
- Fecha debe estar en formato ISO (YYYY-MM-DD)

---

## 💬 Comentarios

### GET /api/comentarios

Obtiene los comentarios **aprobados** (los que ya pasaron la moderación) con **paginación**, ordenados por fecha descendente.

**Request:**
```http
GET /api/comentarios?page=1&limit=10 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "nombre": "María González",
      "mensaje": "Excelente plataforma para aprender sobre nuestras danzas. Muy educativo y bien estructurado.",
      "fecha": "2025-09-06T14:30:45.123Z",
      "estado": "aprobado"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

**Parámetros de URL:**
- `page` (número) - Página a consultar [opcional, default 1]
- `limit` (número) - Ítems por página [opcional, default 10, máx 50]

**Ordenamiento**: Por fecha descendente (más nuevos primero)  
**Nota**: Solo se devuelven comentarios con `estado = "aprobado"`. Los pendientes no son visibles al público.

---

### GET /api/comentarios/pendientes

Lista los comentarios que esperan moderación. 🔒 **Requiere clave de administrador**

**Request:**
```http
GET /api/comentarios/pendientes HTTP/1.1
Host: localhost:3000
X-API-Key: mi-clave-secreta
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "nombre": "Carlos López",
      "mensaje": "Me encantó aprender sobre la historia de la Chacarera.",
      "fecha": "2025-09-07T09:12:00.000Z",
      "estado": "pendiente"
    }
  ]
}
```

---

### GET /api/comentarios/rechazados

Lista los comentarios rechazados. 🔒 **Requiere clave de administrador**

**Request:**
```http
GET /api/comentarios/rechazados HTTP/1.1
Host: localhost:3000
X-API-Key: mi-clave-secreta
```

---

### PUT /api/comentarios/:id/estado

Aprueba o rechaza un comentario. 🔒 **Requiere clave de administrador**

**Request:**
```http
PUT /api/comentarios/7/estado HTTP/1.1
Host: localhost:3000
Content-Type: application/json
X-API-Key: mi-clave-secreta

{
  "estado": "aprobado"
}
```

**Valores válidos de `estado`:** `aprobado` | `rechazado`

**Response (200 OK):**
```json
{
  "success": true,
  "data": { "id": 7, "estado": "aprobado" }
}
```

---

### DELETE /api/comentarios/:id

Elimina un comentario de la base de datos. 🔒 **Requiere clave de administrador**

**Request:**
```http
DELETE /api/comentarios/7 HTTP/1.1
Host: localhost:3000
X-API-Key: mi-clave-secreta
```

---

### POST /api/comentarios

Crea un nuevo comentario en el Libro de Visitas. Es público (cualquier visitante puede escribirlo), pero el comentario queda **pendiente de moderación**: recién aparece en el sitio cuando el administrador lo aprueba.

**Request:**
```http
POST /api/comentarios HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "nombre": "Carlos López",
  "mensaje": "Me encantó aprender sobre la historia de la Chacarera. Ahora entiendo mejor la cultura de mi región."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "nombre": "Carlos López",
    "mensaje": "Me encantó aprender sobre la historia de la Chacarera...",
    "fecha": "2025-09-06T15:45:22.456Z",
    "estado": "pendiente"
  }
}
```

**Response (400 Bad Request - Campos Faltantes):**
```json
{
  "success": false,
  "error": "Nombre y mensaje son obligatorios"
}
```

**Response (400 Bad Request - Longitud Nombre):**
```json
{
  "success": false,
  "error": "El nombre debe tener entre 2 y 100 caracteres"
}
```

**Response (400 Bad Request - Longitud Mensaje):**
```json
{
  "success": false,
  "error": "El mensaje debe tener entre 5 y 1000 caracteres"
}
```

**Parámetros del Body:**
- `nombre` (string, 2-100) - Nombre del autor [requerido]
- `mensaje` (string, 5-1000) - Contenido del comentario [requerido]

**Validaciones:**
- Nombre: Entre 2 y 100 caracteres
- Mensaje: Entre 5 y 1000 caracteres
- Ambos campos obligatorios
- Fecha se asigna automáticamente en el servidor

**Timestamp**: Se asigna automáticamente como ISO 8601 (UTC)

---

## 🎓 Cursos Premium

Los cursos son contenido **pago** (material, guías, videos de Drive) que se vende fuera de la página. El enlace real de Drive se guarda **solo en el servidor**: nunca aparece en el HTML público, ni en el listado de cursos ni en el panel. Se entrega únicamente a través del endpoint [Mis Cursos](#mis-cursos) a quien presente un código de acceso válido.

Todos los endpoints de esta sección 🔒 **requieren clave de administrador**.

### GET /api/cursos

Lista todos los cursos. **Respuesta:** los cursos **no** incluyen `drive_url` por seguridad.

**Request:**
```http
GET /api/cursos HTTP/1.1
Host: localhost:3000
X-API-Key: mi-clave-secreta
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Curso Completo de Chacarera",
      "descripcion": "Del nivel inicial al avanzado, con videos y guías.",
      "creado": "2026-08-06T21:00:00.000Z"
    }
  ]
}
```

### POST /api/cursos

Crea un curso. El `drive_url` es obligatorio pero queda guardado en el servidor.

**Request:**
```http
POST /api/cursos HTTP/1.1
Host: localhost:3000
Content-Type: application/json
X-API-Key: mi-clave-secreta

{
  "nombre": "Curso Completo de Chacarera",
  "descripcion": "Del nivel inicial al avanzado, con videos y guías.",
  "drive_url": "https://drive.google.com/uc?export=download&id=ABc123..."
}
```

**Response (201 Created):** `{ "success": true, "data": { "id": 1, "nombre": "...", "descripcion": "..." } }`

**Parámetros del Body:**
- `nombre` (string) - Nombre del curso [requerido]
- `descripcion` (string) - Descripción [opcional]
- `drive_url` (string) - Enlace privado del contenido [requerido]

### PUT /api/cursos/:id

Edita nombre, descripción y/o enlace de un curso.

### DELETE /api/cursos/:id

Elimina un curso y **todos sus códigos asociados**.

---

## 🔑 Códigos de Acceso

Cada venta se convierte en un código único (formato `DFA-XXXX-XXXX`) que el admin le pasa al alumno. Un código activo se puede usar más de una vez (el alumno conserva el acceso); al eliminarlo, queda revocado.

### GET /api/codigos

Lista todos los códigos con su curso, cliente, estado y fechas. 🔒 **Admin**

```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "codigo": "DFA-DBTY-CN2V",
      "curso_id": 1,
      "curso_nombre": "Curso Completo de Chacarera",
      "nombre_cliente": "María González",
      "estado": "activo",
      "creado": "2026-08-06T21:05:00.000Z",
      "usado": null
    }
  ]
}
```

### POST /api/codigos

Genera un nuevo código. 🔒 **Admin**

**Request:**
```http
POST /api/codigos HTTP/1.1
Host: localhost:3000
Content-Type: application/json
X-API-Key: mi-clave-secreta

{ "curso_id": 1, "nombre_cliente": "María González" }
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": { "id": 3, "codigo": "DFA-DBTY-CN2V", "curso_id": 1, "nombre_cliente": "María González", "estado": "activo" }
}
```

**Errores:** 400 si el curso no existe o no se envía `curso_id`.

### DELETE /api/codigos/:id

Elimina (revoca) un código. 🔒 **Admin** — el alumno pierde el acceso.

---

## 🎫 Mis Cursos

Endpoint **público** por el que un alumno entrega su código y, si es válido, recibe el enlace del curso.

### POST /api/mis-cursos

**Request:**
```http
POST /api/mis-cursos HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{ "codigo": "DFA-DBTY-CN2V" }
```

**Response (200 OK)** — aquí sí se devuelve el enlace:
```json
{
  "success": true,
  "data": {
    "curso": {
      "id": 1,
      "nombre": "Curso Completo de Chacarera",
      "descripcion": "Del nivel inicial al avanzado.",
      "drive_url": "https://drive.google.com/uc?export=download&id=ABc123..."
    }
  }
}
```

**Errores:**
- `400 Bad Request` → falta el campo `codigo`
- `404 Not Found` → el código no existe o fue revocado

---

## 📂 Recursos

Material **gratuito** que se muestra en la sección "Recursos" del sitio (PDFs, libros, galerías de fotos de peñas, carpetas de Drive). Se divide en 3 categorías: `cursos`, `libros` e `imagenes`.

### GET /api/recursos

Lista todos los recursos (público), ordenados por categoría.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "categoria": "libros",
      "titulo": "Manual de Chacarera (PDF)",
      "descripcion": "Guía completa con historia y pasos.",
      "url": "https://drive.google.com/uc?export=download&id=ABc123..."
    }
  ]
}
```

### POST /api/recursos — 🔒 Admin

**Body:**
- `categoria` (string) - `cursos` | `libros` | `imagenes` [requerido]
- `titulo` (string) - Título del recurso [requerido]
- `descripcion` (string) - Descripción [opcional]
- `url` (string) - Enlace (Drive o URL) [requerido]

### PUT /api/recursos/:id — 🔒 Admin

Edita un recurso existente. Mismos campos que POST.

### DELETE /api/recursos/:id — 🔒 Admin

Elimina un recurso.

---

## ⚙️ Configuración

### GET /api/config

Configuración pública: imagen de portada y botón de la portada.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hero_background_url": "https://drive.google.com/thumbnail?id=1IrSBR...&sz=w1600",
    "hero_boton_drive_url": "https://drive.google.com/uc?export=download&id=...",
    "hero_boton_drive_texto": "📘 Descargar Curso"
  }
}
```

### PUT /api/config — 🔒 Admin

Actualiza la configuración. Acepta cualquier combinación de los 3 campos.

**Request:**
```http
PUT /api/config HTTP/1.1
Content-Type: application/json
X-API-Key: mi-clave-secreta

{ "hero_background_url": "https://drive.google.com/...", "hero_boton_drive_texto": "📘 Descargar Curso" }
```

---

## 👀 Visitas y Estadísticas

### POST /api/visita

Endpoint **público**: suma una visita. El frontend lo llama una vez por sesión de navegador (via `sessionStorage`), y el servidor limita 60 por IP por hora.

**Response (200 OK):**
```json
{ "success": true, "data": { "visitas": 128 } }
```

### GET /api/estadisticas — 🔒 Admin

Totales del sitio para el panel de administración.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "visitas": 128,
    "danzas": 13,
    "eventos": 3,
    "comentariosAprobados": 2,
    "cursos": 2,
    "codigosActivos": 5
  }
}
```

---

## 💾 Respaldo y Restauración

### GET /api/backup — 🔒 Admin

Descarga un JSON con **todo** el contenido: danzas, eventos, comentarios, cursos, códigos, configuración y recursos. Guardalo en tu PC como copia de seguridad.

### POST /api/restore — 🔒 Admin

Reemplaza **todos** los datos actuales por el contenido de un respaldo (conserva los ids originales y reinicia las secuencias en PostgreSQL).

**Request:**
```http
POST /api/restore HTTP/1.1
Content-Type: application/json
X-API-Key: mi-clave-secreta

{ ...contenido completo del JSON de /api/backup... }
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { "restaurados": { "danzas": 13, "eventos": 3, "comentarios": 2, "cursos": 2, "codigos": 5, "config": 3, "recursos": 1 } }
}
```

> ⚠️ El restore **borra primero** los datos existentes. Descargá un respaldo antes de restaurar.

---

## 📊 Códigos de Estado HTTP

| Código | Significado | Cuándo Ocurre |
|--------|-------------|--------------|
| **200** | OK | Solicitud exitosa (GET) |
| **201** | Created | Recurso creado exitosamente (POST) |
| **400** | Bad Request | Errores de validación en los datos |
| **404** | Not Found | Recurso no encontrado |
| **500** | Server Error | Error interno del servidor |

---

## 🔧 Ejemplos cURL

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Listar todas las danzas
```bash
curl http://localhost:3000/api/danzas
```

### Obtener una danza específica
```bash
curl http://localhost:3000/api/danzas/1
```

### Crear una nueva danza
```bash
curl -X POST http://localhost:3000/api/danzas \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mi-clave-secreta" \
  -d '{
    "nombre": "Vidala",
    "region": "Noroeste",
    "historia": "Composición de carácter elegíaco...",
    "coreografia": "Movimientos lentos y expresivos...",
    "video_url": "https://www.youtube.com/embed/..."
  }'
```

### Listar eventos
```bash
curl http://localhost:3000/api/eventos
```

### Crear un evento
```bash
curl -X POST http://localhost:3000/api/eventos \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mi-clave-secreta" \
  -d '{
    "titulo": "Peña Folklórica",
    "fecha": "2025-12-21",
    "lugar": "Plaza Central",
    "descripcion": "Encuentro de danzas folklóricas"
  }'
```

### Listar comentarios aprobados
```bash
curl http://localhost:3000/api/comentarios
```

### Listar comentarios pendientes (admin)
```bash
curl http://localhost:3000/api/comentarios/pendientes \
  -H "X-API-Key: mi-clave-secreta"
```

### Aprobar un comentario (admin)
```bash
curl -X PUT http://localhost:3000/api/comentarios/7/estado \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mi-clave-secreta" \
  -d '{"estado": "aprobado"}'
```

### Crear un comentario (público, queda pendiente)
```bash
curl -X POST http://localhost:3000/api/comentarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Tu Nombre",
    "mensaje": "Este es mi comentario sobre las danzas folklóricas argentinas."
  }'
```

### Crear un curso (admin)
```bash
curl -X POST http://localhost:3000/api/cursos \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mi-clave-secreta" \
  -d '{
    "nombre": "Curso Completo de Chacarera",
    "descripcion": "Del nivel inicial al avanzado.",
    "drive_url": "https://drive.google.com/uc?export=download&id=ABc123..."
  }'
```

### Generar un código de acceso (admin)
```bash
curl -X POST http://localhost:3000/api/codigos \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mi-clave-secreta" \
  -d '{"curso_id": 1, "nombre_cliente": "María González"}'
```

### Usar el código desde la web (público)
```bash
curl -X POST http://localhost:3000/api/mis-cursos \
  -H "Content-Type: application/json" \
  -d '{"codigo": "DFA-DBTY-CN2V"}'
```

### Usar jq para formatear respuestas
```bash
curl http://localhost:3000/api/danzas | jq '.'
```

---

## ⚠️ Manejo de Errores

Todos los errores siguen este formato:

```json
{
  "success": false,
  "error": "Descripción del error"
}
```

### Errores Comunes

**Validación fallida:**
```json
{
  "success": false,
  "error": "Nombre y región son obligatorios"
}
```

**Recurso no encontrado:**
```json
{
  "success": false,
  "error": "Danza no encontrada"
}
```

**Error interno del servidor:**
```json
{
  "success": false,
  "error": "Error interno del servidor"
}
```

---

## 🔐 Seguridad

- **CORS**: Habilitado para orígenes configurados
- **Clave de administrador**: Todas las operaciones de escritura y moderación exigen `ADMIN_KEY` (header `X-API-Key`). Aunque alguien use la API directamente sin pasar por la página, no puede crear, editar ni borrar nada sin la clave.
- **Validaciones**: Todas las entradas se validan antes de guardar
- **SQL Injection**: Protegido mediante prepared statements
- **Moderación de comentarios**: Los comentarios del público quedan `pendiente` y solo se publican tras aprobación del administrador

---

## 📈 Límites

- **Paginación**: `page` default 1; `limit` default 12 (danzas), 6 (eventos), 10 (comentarios); máximo 50
- **Longitud de cadenas**: Especificada por campo
- **Base de datos**: PostgreSQL en producción (persistente), SQLite en desarrollo

---

## 🚀 Tips de Desarrollo

1. **Testing rápido**: Usa Postman, Insomnia, o REST Client de VS Code
2. **Debugging**: Revisa los logs del servidor en la terminal
3. **CORS**: Si tienes problemas, revisa la configuración en `server.js`
4. **Base de datos**: En desarrollo usa SQLite (`danzas.db`). En producción usa PostgreSQL si está definida `DATABASE_URL`. `npm run init-db` borra y recrea los datos de ejemplo.

---

Última actualización: Agosto 2026
