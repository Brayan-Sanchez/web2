

Este documento constituye la guía oficial del proyecto para instalación, ejecución y referencia de la API. Para cambios en la configuración por defecto, editar los archivos `backend/*.go` o proveer las variables de entorno indicadas.
# QuizForge — Documentación (español)

Última actualización: 2025-12-03

Este documento explica cómo instalar, configurar y ejecutar el proyecto QuizForge (backend Go + frontend React) en Windows. Incluye la configuración de la base de datos PostgreSQL, comandos para desarrollo y referencias de la API.

---
**Resumen rápido**
- Backend: Go (Gorilla Mux). El servidor corre en `:8080` por defecto.
- Frontend: React (Create React App). El servidor de desarrollo corre en `:3000` por defecto.
- Base de datos: PostgreSQL (el proyecto incluye `database/schema.sql`).

---
## Requisitos
- Git
- Go (recomendado 1.20+)
- Node.js + npm (recomendado Node 18+)
- PostgreSQL 12+
- Opcional: editor (VS Code)

---
## Estructura principal del repositorio
- `backend/` — servidor en Go
- `database/schema.sql` — script SQL para crear las tablas
- `frontend/` — aplicación React

---
## Valores por defecto detectados en el código (importante)
> Nota: el backend actualmente usa una cadena de conexión y una clave JWT codificadas en el código fuente. Puedes cambiar esto editando los archivos indicados abajo.

- Conexión a la base de datos por defecto (en `backend/db.go`):
  - `postgres://postgres:2234@localhost:5432/quizforge_db?sslmode=disable`
  - Usuario: `postgres`, contraseña: `2234`, DB: `quizforge_db`, puerto: `5432`.
- Puerto del backend (en `backend/main.go`): `8080` (escucha en `:8080`).
- Origen permitido CORS (en `backend/main.go`): `http://localhost:3000`.
- Clave JWT (en `backend/auth.go`): `2435` (cadena corta — recomendamos cambiarla por una más segura).

Si prefieres no tener valores codificados, modifica `backend/db.go` y `backend/auth.go` para leer variables de entorno (p. ej. `DATABASE_URL`, `JWT_SECRET`) antes de ejecutar.

---
## 1) Clonar el repositorio
En PowerShell:
```powershell
cd C:\Users\TuUsuario\Projects
git clone <url-del-repositorio> quizforge
cd quizforge
```

---
## 2) Crear la base de datos e importar el esquema
1. Asegúrate de que PostgreSQL esté instalado y el servicio en ejecución.
2. Ejecuta (PowerShell):
```powershell
psql -U postgres
# En la consola psql:
CREATE DATABASE quizforge_db;
ALTER USER postgres WITH PASSWORD '2234'; -- opcional si quieres usar la contraseña por defecto del código
# O crea un usuario independiente:
CREATE USER quizuser WITH PASSWORD 'quizpass';
CREATE DATABASE quizforge_db OWNER quizuser;
\q
```
3. Importa el esquema del proyecto:
```powershell
psql -U quizuser -d quizforge_db -f .\database\schema.sql
```

---
## 3) Ejecutar el backend (desarrollo)
Desde la carpeta `backend`:
```powershell
cd .\backend
go mod download
go run .
```
Salida esperada: el servidor indica que corre en `http://localhost:8080`.

Si quieres compilar un binario:
```powershell
go build -o quizforge-backend
.\quizforge-backend.exe
```

### Cambiar la conexión de BD o la clave JWT
Actualmente la conexión y la clave JWT están codificadas. Para cambiar:
- Edita `backend/db.go`: actualiza la variable `connStr` con tu URL de conexión.
- Edita `backend/auth.go`: modifica `jwtKey` por una cadena segura.

Puedes mejorar el proyecto leyendo variables de entorno con `os.Getenv("DATABASE_URL")` y `os.Getenv("JWT_SECRET")`.

---
## 4) Ejecutar el frontend (desarrollo)
En otra terminal PowerShell:
```powershell
cd .\frontend
npm install
npm start
```
- El frontend suele abrir en `http://localhost:3000`.
- Si quieres que el frontend apunte a un backend distinto, revisa `frontend/src/services/api.js` para ver si utiliza `process.env.REACT_APP_API_URL`. Si no está implementado, modifica las llamadas para leer la URL del backend desde `process.env.REACT_APP_API_URL`.
- Para establecer una variable de entorno temporal (solo para la sesión):
```powershell
$env:REACT_APP_API_URL = "http://localhost:8080"
npm start
```

---
## 5) Endpoints principales (resumen)
- POST `/register` — registrar usuario. Body: `{ email, username, password }`.
- POST `/login` — iniciar sesión. Body: `{ email, username?, password }`. Respuesta: `{ token, role, user, username }`.
- GET `/questions/fetch` — obtiene preguntas de OpenTDB y las guarda.
- GET `/questions` — obtener preguntas guardadas (filtros `categoria`, `dificultad`).
- POST `/attempts/answers` — guardar respuestas (array de objetos `AttemptAnswer`). Devuelve resumen `{ userId, username, correct, incorrect, percentage }`.
- GET `/user/resumen` — resumen del usuario (protegido, rol `user`).
- GET `/user/historial` — historial de intentos del usuario (protegido, rol `user`).
- GET `/admin/historial` — historial global (protegido, rol `admin`).
- Admin user management (protegido, rol `admin`):
  - GET `/admin/users` — listar usuarios
  - POST `/admin/users` — crear usuario (body: `{ email, username, password, role }`)
  - PUT/PATCH `/admin/users/{id}` — actualizar role (body `{ role }`)
  - DELETE `/admin/users/{id}` — eliminar usuario

> Importante: estas rutas protegidas esperan un header `Authorization: Bearer <token>` con el JWT obtenido al hacer login.

---
## 6) Crear un usuario admin rápido
Puedes crear un usuario admin usando la ruta admin (requiere token admin). Si no tienes un admin aún, una forma rápida durante desarrollo es insertar directamente en la DB:
```sql
INSERT INTO users (email, username, password, role) VALUES ('admin@example.com', 'admin', '<hash>', 'admin');
```
Donde `<hash>` es la contraseña hasheada con bcrypt. Para generar un hash: usa un pequeño script Go, Node o cambia temporalmente el código de registro para que inserte sin hashear (solo en desarrollo). Recomiendo crear via API `POST /admin/users` una vez tengas un token admin.

---
## 7) Troubleshooting (problemas comunes)
- Puerto 8080 ocupado: encuentra el PID con `netstat -ano | findstr :8080` y termina el proceso o cambia el puerto en `backend/main.go`.
- Error de conexión a DB: revisa que el servicio PostgreSQL esté corriendo y que la cadena de conexión sea correcta.
- Errores `ON CONFLICT`: el código está diseñado para hacer `UPDATE` y si no hay filas hace `INSERT` para el resumen; si ves errores revisa que las tablas estén creadas correctamente con `schema.sql`.
- CORS: si ves errores en consola del navegador revisa la cabecera `Access-Control-Allow-Origin` en `main.go`.
- Login devuelve `Usuario no encontrado` o `Credenciales inválidas`: revisa que los registros de `users` existan y que las contraseñas estén correctamente hasheadas.

---
## 8) Notas de seguridad y recomendaciones
- No dejes `jwtKey` ni cadenas de conexión codificadas en producción. Muévelas a variables de entorno `JWT_SECRET` y `DATABASE_URL`.
- Usa contraseñas seguras para la base de datos.
- Limita `Access-Control-Allow-Origin` a orígenes de confianza.

---
## 9) Contribuir
- Fork + pull request. Mantén cambios separados por feature branches.
- Antes de hacer PR: `go fmt`, `gofmt`, y `npm run build` (si cambias frontend).

---
