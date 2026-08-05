# 📡 Documentación de API - Danzas Folklóricas Argentinas

Referencia completa de todos los endpoints disponibles en la API REST.

## 🔗 Base URL

**Desarrollo**: `http://localhost:3000`  
**Producción**: `https://tu-backend.onrender.com`

## 📋 Tabla de Contenidos

- [Health Check](#health-check)
- [Autenticación de Administrador](#autenticación-de-administrador)
- [Danzas](#danzas)
- [Eventos](#eventos)
- [Comentarios](#comentarios)
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

---

## 💃 Danzas

### GET /api/danzas

Obtiene la lista completa de danzas folklóricas.

**Request:**
```http
GET /api/danzas HTTP/1.1
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
      "historia": "Danza festiva de origen andino que representa la cosecha y la alegría...",
      "coreografia": "Movimientos circulares, giros de parejas, palmoteos rítmicos...",
      "video_url": "https://www.youtube.com/embed/CKG_5PFQIA4"
    },
    {
      "id": 2,
      "nombre": "Cueca",
      "region": "Noroeste (compartida con Chile)",
      "historia": "Danza de cortejo entre hombre y mujer...",
      "coreografia": "Movimientos de cadera, giros, juego de pañuelos...",
      "video_url": "https://www.youtube.com/embed/iQWxNgL9z24"
    }
  ]
}
```

**Parámetros**: Ninguno  
**Paginación**: No (devuelve todas las danzas)  
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
- `historia` (string, 0-2000) - Historia y contexto [opcional]
- `coreografia` (string, 0-2000) - Descripción de coreografía [opcional]
- `video_url` (string, 0-500) - URL de video (YouTube embed) [opcional]

**Validaciones:**
- Nombre debe ser único
- Ambos campos requeridos deben estar presentes

---

## 📅 Eventos

### GET /api/eventos

Obtiene la lista de eventos ordenados por fecha descendente.

**Request:**
```http
GET /api/eventos HTTP/1.1
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
    },
    {
      "id": 2,
      "titulo": "Taller de Chacarera Intermedio",
      "fecha": "2025-09-13",
      "lugar": "Estudio de Danzas Folklóricas, San Miguel",
      "descripcion": "Taller intensivo sobre técnica y coreografía de Chacarera. Requisito: experiencia previa."
    }
  ]
}
```

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

Obtiene los últimos 50 comentarios **aprobados** (los que ya pasaron la moderación), ordenados por fecha descendente.

**Request:**
```http
GET /api/comentarios HTTP/1.1
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
  ]
}
```

**Límite**: Últimos 50 comentarios  
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

- **Comentarios listados**: Máximo 50
- **Longitud de cadenas**: Especificada por campo
- **Tamaño de base de datos**: Sin límite en desarrollo, ilimitado en Render

---

## 🚀 Tips de Desarrollo

1. **Testing rápido**: Usa Postman, Insomnia, o REST Client de VS Code
2. **Debugging**: Revisa los logs del servidor en la terminal
3. **CORS**: Si tienes problemas, revisa la configuración en `server.js`
4. **Base de datos**: Los datos se reinician al reiniciar el servidor (en desarrollo)

---

Última actualización: Septiembre 2025
