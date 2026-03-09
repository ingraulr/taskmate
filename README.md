# TaskMate

Aplicación móvil full-stack para gestión de tareas, construida con React Native y Node.js. Permite registrarse, iniciar sesión, crear tareas, marcarlas como completadas, editarlas, eliminarlas y reordenarlas con drag-and-drop.

---

## Tecnologías

### Frontend
![React Native](https://img.shields.io/badge/React_Native-0.83.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK_55-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React Navigation](https://img.shields.io/badge/React_Navigation-7.x-6B52AE?style=for-the-badge&logo=react&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-9.x-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

### Infraestructura
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## Tabla de contenidos

- [Funcionalidades](#funcionalidades)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución](#instalación-y-ejecución)
  - [1. Clonar el repositorio](#1-clonar-el-repositorio)
  - [2. Ejecutar el backend](#2-ejecutar-el-backend)
  - [3. Ejecutar el frontend](#3-ejecutar-el-frontend)
- [Variables de entorno](#variables-de-entorno)
- [Referencia de la API](#referencia-de-la-api)
- [Dependencias del frontend](#dependencias-del-frontend)
- [Dependencias del backend](#dependencias-del-backend)

---

## Funcionalidades

| Funcionalidad | Descripción |
|---|---|
| Autenticación | Registro e inicio de sesión con JWT |
| Gestión de tareas | Crear, leer, actualizar y eliminar tareas |
| Completar tarea | Marcar tareas como pendientes o completadas |
| Reordenar tareas | Mantén presionado el ícono `≡` y arrastra para reordenar |
| Pantalla de cuenta | Avatar con foto de perfil (galería) o iniciales, muestra el correo registrado |
| Cambio de foto | Selección desde la galería del dispositivo, recorte cuadrado |
| Cambio de correo | Modal con validación de formato, unicidad y contraseña actual |
| Cambio de contraseña | Modal con verificación de contraseña actual, mínimo 6 caracteres y confirmación |
| Pantallas de carga | Loader al inicio, al hacer logout, al agregar y al eliminar tareas |
| Notificaciones toast | Feedback visual en cada acción del usuario |
| Sesión persistente | Token y correo almacenados con AsyncStorage |

---

## Estructura del proyecto

```
taskmate/
├── docker-compose.yml              # Orquesta los contenedores de API y PostgreSQL
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                # Punto de entrada Express (puerto 3000)
│       ├── db.ts                   # Conexión a PostgreSQL e inicialización del esquema
│       ├── controllers/
│       │   ├── auth.controller.ts  # Registro, login, getMe y cambio de contraseña
│       │   └── tasks.controller.ts # Operaciones CRUD de tareas
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   └── tasks.routes.ts
│       └── middleware/
│           └── auth.middleware.ts  # Verificación de JWT
│
└── frontend/
    ├── App.tsx                     # Componente raíz, navegación y gesture handler
    ├── app.json                    # Configuración de Expo
    ├── index.ts                    # Punto de entrada de la app
    ├── screens/
    │   ├── LoginScreen.tsx
    │   ├── RegisterScreen.tsx
    │   ├── Tasks.Screen.tsx        # Pantalla principal con drag-and-drop y loaders
    │   └── AccountScreen.tsx       # Pantalla de cuenta: avatar, email y cambio de contraseña
    ├── components/
    │   └── Toast.tsx               # Notificación toast animada
    └── services/
        └── api.ts                  # Instancia de Axios y métodos de la API
```

---

## Requisitos previos

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) y Docker Compose
- [Expo Go](https://expo.dev/client) instalado en tu dispositivo iOS o Android

---

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd taskmate
```

### 2. Ejecutar el backend

El backend corre completamente en contenedores. Un solo comando levanta la base de datos PostgreSQL y el servidor API:

```bash
docker compose up --build
```

- **API** → `http://localhost:3000`
- **PostgreSQL** → `localhost:5434`

El esquema de la base de datos (tablas `users` y `tasks`) se crea automáticamente al primer arranque.

> **Nota:** Si el servicio `api` falla en el primer arranque, ejecuta `docker compose up` nuevamente. Esto ocurre cuando el contenedor de PostgreSQL aún no está listo para aceptar conexiones.

### 3. Ejecutar el frontend

```bash
cd frontend
npm install
npx expo start --clear
```

Escanea el código QR con **Expo Go** desde tu dispositivo.

> **Emulador Android:** La URL base se resuelve automáticamente a `http://10.0.2.2:3000/api`.
> **Simulador iOS / dispositivo físico:** Se resuelve a `http://localhost:3000/api`.
> Si pruebas en un **dispositivo físico**, actualiza la URL base en `frontend/services/api.ts` con la IP local de tu máquina (ej. `http://192.168.1.x:3000/api`).

---

## Variables de entorno

El backend lee las siguientes variables, configuradas en `docker-compose.yml`:

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `DATABASE_URL` | `postgresql://taskuser:taskpass@postgres:5432/taskmate` | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | `secreto_seguro_2026` | Clave para firmar los tokens JWT |

> **Producción:** Cambia `JWT_SECRET` por una cadena larga y aleatoria. Nunca la subas al repositorio.

Para ejecutar el backend localmente sin Docker, crea el archivo `backend/.env`:

```env
DATABASE_URL=postgresql://taskuser:taskpass@localhost:5434/taskmate
JWT_SECRET=tu_secreto_aqui
```

Luego:

```bash
cd backend
npm install
npm run dev
```

---

## Referencia de la API

Todos los endpoints marcados con 🔒 requieren el header `Authorization: Bearer <token>`.

### Autenticación

| Método | Endpoint | Auth | Body | Descripción |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | — | `{ email, password }` | Crea una nueva cuenta |
| `POST` | `/api/auth/login` | — | `{ email, password }` | Retorna un token JWT |
| `GET` | `/api/auth/me` | 🔒 | — | Retorna el `id` y `email` del usuario autenticado |
| `PUT` | `/api/auth/password` | 🔒 | `{ currentPassword, newPassword }` | Cambia la contraseña verificando la actual |
| `PUT` | `/api/auth/email` | 🔒 | `{ newEmail, password }` | Cambia el correo verificando contraseña y unicidad |

### Tareas

| Método | Endpoint | Auth | Body | Descripción |
|---|---|---|---|---|
| `GET` | `/api/tasks` | 🔒 | — | Obtiene todas las tareas del usuario autenticado |
| `POST` | `/api/tasks` | 🔒 | `{ titulo }` | Crea una nueva tarea |
| `PUT` | `/api/tasks/:id` | 🔒 | `{ completada?, titulo? }` | Actualiza el estado o título de una tarea |
| `DELETE` | `/api/tasks/:id` | 🔒 | — | Elimina una tarea |

---

## Dependencias del frontend

```json
"dependencies": {
  "@react-native-async-storage/async-storage": "2.2.0",
  "@react-navigation/native": "^7.1.33",
  "@react-navigation/native-stack": "^7.14.4",
  "axios": "^1.13.6",
  "expo": "~55.0.5",
  "expo-status-bar": "~55.0.4",
  "react": "19.2.0",
  "react-native": "0.83.2",
  "react-native-draggable-flatlist": "^4.0.3",
  "react-native-gesture-handler": "~2.30.0",
  "react-native-reanimated": "4.2.1",
  "react-native-safe-area-context": "~5.6.2",
  "react-native-screens": "~4.23.0"
},
"devDependencies": {
  "@types/react": "~19.2.2",
  "typescript": "~5.8.0"
}
```

---

## Dependencias del backend

```json
"dependencies": {
  "bcryptjs": "^3.0.3",
  "cors": "^2.8.6",
  "dotenv": "^17.3.1",
  "express": "^5.2.1",
  "jsonwebtoken": "^9.0.3",
  "pg": "^8.20.0"
},
"devDependencies": {
  "@types/bcryptjs": "^2.4.6",
  "@types/cors": "^2.8.19",
  "@types/express": "^5.0.6",
  "@types/jsonwebtoken": "^9.0.10",
  "@types/node": "^25.3.5",
  "@types/pg": "^8.18.0",
  "nodemon": "^3.1.14",
  "ts-node": "^10.9.2",
  "typescript": "^5.9.3"
}
```
