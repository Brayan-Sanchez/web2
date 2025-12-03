# QuizForge

Última actualización: 2025-12-03

Documento oficial de instalación, configuración y referencia técnica de QuizForge — aplicación de quizzes con backend en Go y frontend en React.

Este documento describe los requisitos, la configuración de la base de datos, la ejecución en modo desarrollo, las variables de entorno utilizadas por el proyecto y la referencia de los endpoints principales.

Contenido
- Tecnologías
- Requisitos
- Estructura del repositorio
- Configuración y valores por defecto detectados
- Instalación y ejecución (desarrollo)
- Variables de entorno recomendadas
- Referencia de la API
- Resumen del esquema de base de datos
- Resolución de problemas
- Consideraciones de seguridad

---
## Tecnologías

- Backend: Go, Gorilla Mux, lib/pq, bcrypt, jwt
- Frontend: React (Create React App), React Router
- Base de datos: PostgreSQL

---
## Requisitos

- Git
- Go (recomendado 1.20+)
- Node.js y npm (recomendado Node 18+)
- PostgreSQL 12+

---
## Estructura del repositorio

- `backend/` — servidor implementado en Go (rutas, acceso a BD, autenticación)
- `database/schema.sql` — script SQL para crear las tablas necesarias
- `frontend/` — aplicación cliente en React


---
## Configuración y valores por defecto detectados

Los siguientes valores se han encontrado codificados en el código fuente actual. Antes de desplegar en producción, trasladar estas configuraciones a variables de entorno.

- Cadena de conexión por defecto (archivo `backend/db.go`):
  - `postgres://postgres:2234@localhost:5432/quizforge_db?sslmode=disable`
- Puerto del backend (archivo `backend/main.go`): `8080`
- Origen CORS permitido (archivo `backend/main.go`): `http://localhost:3000`
- Clave JWT por defecto (archivo `backend/auth.go`): `2435`

Recomendación: sustituir estas cadenas por variables de entorno seguras (`DATABASE_URL`, `JWT_SECRET`, `PORT`) y documentar `.env.example` para entornos de desarrollo.

---
## Instalación y ejecución (desarrollo)

Las instrucciones siguientes están redactadas para Microsoft Windows (PowerShell). Adaptar rutas y comandos para otros sistemas.

1) Clonar el repositorio

```powershell
cd C:\Users\TuUsuario\Projects
git clone <[URL_DEL_REPOSITORIO](https://github.com/Brayan-Sanchez/web2)> quizforge
cd quizforge
```

2) Preparar la base de datos

1. Asegurarse de que el servicio de PostgreSQL esté activo.
2. Crear usuario y base de datos (ejemplo):

```powershell
psql -U postgres
# En la consola psql:
CREATE USER quizuser WITH PASSWORD 'quizpass';
CREATE DATABASE quizforge_db OWNER quizuser;
\q
```

3. Importar el esquema de tablas incluido en el repositorio:

```powershell
psql -U quizuser -d quizforge_db -f .\database\schema.sql
```

3) Ejecutar el backend

```powershell
cd .\backend
go mod download
go run .
```

Salida esperada: el servidor escucha en `http://localhost:8080`.

4) Ejecutar el frontend

```powershell
cd .\frontend
npm install
npm start
```

El cliente se sirve por defecto en `http://localhost:3000`.

---
## Variables de entorno recomendadas

Definir las variables de entorno siguientes evita exponer credenciales en el código y facilita despliegues reproducibles.

- `DATABASE_URL` — URL de conexión a PostgreSQL, por ejemplo: `postgres://quizuser:quizpass@localhost:5432/quizforge_db?sslmode=disable`
- `PORT` — puerto para el backend (valor por defecto: `8080`)
- `JWT_SECRET` — clave secreta para firmar/verificar JWT (usar una cadena larga y aleatoria)
- `REACT_APP_API_URL` — (opcional) URL base del API que usa el frontend (ej.: `http://localhost:8080`)

Implementación recomendada: crear un archivo `.env.example` con las variables descritas y documentar cómo crear el `.env` local para desarrollo.

---
## Referencia de la API

Todas las solicitudes y respuestas deben usar `Content-Type: application/json` cuando correspondan.

1) Registro de usuario

- Método: `POST /register`
- Body:

```json
{ "email": "usuario@example.com", "username": "usuario", "password": "miPass123" }
```

- Respuesta: `201 Created` con cuerpo JSON de confirmación.

2) Autenticación (login)

- Método: `POST /login`
- Body (por email o username): `{ "email": "...", "password": "..." }` o `{ "username": "...", "password": "..." }`.
- Respuesta: `200 OK` con JSON `{ "token": "<JWT>", "role": "user|admin", "user": <userId>, "username": "..." }`.

3) Guardar intentos (respuestas)

- Método: `POST /attempts/answers`
- Body: array de objetos con la forma: `{ "userId": <int>, "questionId": <int>, "selectedAnswer": "...", "isCorrect": <bool> }`.
- Respuesta: `201 Created` y cuerpo JSON con resumen `{ "userId":..., "username":..., "correct":..., "incorrect":..., "percentage":"..." }`.

4) Obtener preguntas

- Método: `GET /questions`
- Query params opcionales: `categoria`, `dificultad`.
- Respuesta: `200 OK` con array de preguntas.

5) Importar preguntas desde OpenTDB

- Método: `GET /questions/fetch`
- Comportamiento: solicita preguntas a OpenTDB, traduce categorías y guarda en la base de datos.

Rutas protegidas (requieren cabecera `Authorization: Bearer <token>`):

- `GET /user/resumen` — resumen del usuario (rol `user`).
- `GET /user/historial` — historial de intentos del usuario (rol `user`).
- `GET /admin/historial` — historial global (rol `admin`).

Administración de usuarios (rol `admin` requerido):

- `GET /admin/users` — listar usuarios.
- `POST /admin/users` — crear usuario. Body: `{ "email","username","password","role" }`.
- `PUT|PATCH /admin/users/{id}` — actualizar rol. Body: `{ "role": "admin|user" }`.
- `DELETE /admin/users/{id}` — eliminar usuario.

Ejemplo de llamada protegida con `curl`:

```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8080/admin/users
```

---
## Resumen del esquema de base de datos

El archivo `database/schema.sql` crea las siguientes tablas principales:

- `users` — columnas: `id`, `email`, `password`, `role`, `username`.
- `questions` — columnas: `id`, `question`, `correct_answer`, `incorrect_answers[]`, `categoria`, `dificultad`, `created_at`.
- `attempts` — columnas: `id`, `user_id` (FK a `users`), `question_id` (FK a `questions`), `selected_answer`, `is_correct`, `answered_at`.
- `attempt_summary` — columnas: `id`, `user_id` (UNIQUE FK a `users`), `correct_count`, `incorrect_count`, `created_at`.

---
## Resolución de problemas

- Puerto ocupado: `netstat -ano | findstr :8080` y `Get-Process -Id <PID>` para identificar el proceso que ocupa el puerto.
- Error de conexión a PostgreSQL: comprobar que el servicio está activo, que las credenciales son correctas y que la cadena de conexión apunta al host/puerto adecuado.
- Errores relacionados con esquema: asegurarse de que `database/schema.sql` se haya importado correctamente antes de ejecutar el backend.
- CORS: comprobar la cabecera `Access-Control-Allow-Origin` en `backend/main.go` si el navegador bloquea peticiones desde el frontend.
- JWT inválido: si se actualiza `JWT_SECRET` los tokens ya emitidos dejarán de ser válidos.

---
## Consideraciones de seguridad

- No almacenar credenciales ni claves (`JWT_SECRET`, cadenas de conexión) en el repositorio. Utilizar variables de entorno seguras o servicios de gestión de secretos.
- Asegurar que las contraseñas almacenadas en la base de datos están hasheadas con `bcrypt` (ya implementado en el código).
- Restringir los orígenes permitidos por CORS en producción.
- Implementar validación de entrada más estricta y controles de rate limiting en entornos públicos.


---
## Mantenimiento y contribución

- Formato de contribución: bifurcar (fork), crear rama por feature, abrir pull request con descripción clara de los cambios.
- Antes de enviar PR ejecutar `gofmt` para el código Go y verificar que `npm run build` en el frontend no introduce errores cuando se modifica la UI.

---

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
