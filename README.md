# TaskMate

A full-stack task management mobile application built with React Native (Expo) and Node.js. Users can register, log in, create tasks, mark them as complete, edit, delete, and reorder them via drag-and-drop.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Run the backend](#2-run-the-backend)
  - [3. Run the frontend](#3-run-the-frontend)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Frontend Dependencies](#frontend-dependencies)
- [Backend Dependencies](#backend-dependencies)

---

## Overview

| Feature | Description |
|---|---|
| Authentication | JWT-based register & login |
| Task management | Create, read, update, delete tasks |
| Completion toggle | Mark tasks done / pending |
| Drag-to-reorder | Long-press handle to reorder tasks |
| Toast notifications | Feedback on every action |
| Persistent session | Token stored with AsyncStorage |

---

## Tech Stack

### Frontend
| Technology | Version |
|---|---|
| React Native | 0.83.2 |
| Expo SDK | 55 |
| TypeScript | ~5.8.0 |
| React Navigation | 7.x |
| Axios | 1.x |
| React Native Reanimated | 4.2.1 |
| React Native Gesture Handler | ~2.30.0 |
| React Native Draggable FlatList | ^4.0.3 |
| AsyncStorage | 2.2.0 |

### Backend
| Technology | Version |
|---|---|
| Node.js | 22 (Alpine) |
| Express | 5.x |
| TypeScript | 5.x |
| PostgreSQL | 15 |
| jsonwebtoken | 9.x |
| bcryptjs | 3.x |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerized API + database |
| PostgreSQL 15 | Relational database |

---

## Project Structure

```
taskmate/
├── docker-compose.yml              # Orchestrates API + PostgreSQL containers
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                # Express entry point (port 3000)
│       ├── db.ts                   # PostgreSQL connection & schema init
│       ├── controllers/
│       │   ├── auth.controller.ts  # register / login logic
│       │   └── tasks.controller.ts # CRUD operations
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   └── tasks.routes.ts
│       └── middleware/
│           └── auth.middleware.ts  # JWT verification
│
└── frontend/
    ├── App.tsx                     # Root component, navigation & gesture setup
    ├── app.json                    # Expo config
    ├── index.ts                    # App entry point
    ├── screens/
    │   ├── LoginScreen.tsx
    │   └── Tasks.Screen.tsx
    ├── components/
    │   └── Toast.tsx               # Animated toast notification
    └── services/
        └── api.ts                  # Axios instance + API methods
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) & Docker Compose
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- [Expo Go](https://expo.dev/client) app on your iOS or Android device

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd taskmate
```

### 2. Run the backend

The backend runs fully containerized. A single command starts both the PostgreSQL database and the API server:

```bash
docker compose up --build
```

- **API** → `http://localhost:3000`
- **PostgreSQL** → `localhost:5434`

The database schema (users and tasks tables) is created automatically on first boot.

> **Note:** The `api` service waits for `postgres` to be ready via `depends_on`. If the API crashes on first start, run `docker compose up` again.

### 3. Run the frontend

```bash
cd frontend
npm install
npx expo start --clear
```

Scan the QR code with **Expo Go** on your device.

> **Android emulator:** The API base URL automatically resolves to `http://10.0.2.2:3000/api`.
> **iOS simulator / physical device:** It resolves to `http://localhost:3000/api`.
> If testing on a **physical device**, update the base URL in `frontend/services/api.ts` to your machine's local IP (e.g., `http://192.168.1.x:3000/api`).

---

## Environment Variables

The backend reads the following variables, configured in `docker-compose.yml`:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://taskuser:taskpass@postgres:5432/taskmate` | PostgreSQL connection string |
| `JWT_SECRET` | `secreto_seguro_2026` | Secret key for signing JWT tokens |

> **Production:** Change `JWT_SECRET` to a long, random string and never commit it to version control.

To run the backend locally without Docker, create `backend/.env`:

```env
DATABASE_URL=postgresql://taskuser:taskpass@localhost:5434/taskmate
JWT_SECRET=your_secret_here
```

Then:

```bash
cd backend
npm install
npm run dev
```

---

## API Reference

All task endpoints require the `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ email, password }` | Create a new account |
| `POST` | `/api/auth/login` | `{ email, password }` | Returns a JWT token |

### Tasks

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | — | Get all tasks for the authenticated user |
| `POST` | `/api/tasks` | `{ titulo }` | Create a new task |
| `PUT` | `/api/tasks/:id` | `{ completada?, titulo? }` | Update task status or title |
| `DELETE` | `/api/tasks/:id` | — | Delete a task |

---

## Frontend Dependencies

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

## Backend Dependencies

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
