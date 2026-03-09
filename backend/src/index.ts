import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes  from './routes/auth.routes';
import tasksRoutes from './routes/tasks.routes';
import { initDB } from './db';

dotenv.config();

// ── Validate required env vars before starting ─────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET debe ser una cadena de al menos 32 caracteres.');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL no está definida.');
  process.exit(1);
}

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────
// Mobile apps (React Native) no envían header Origin, así que pasan siempre.
// La restricción protege contra llamadas desde navegadores web no autorizados.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000,http://10.0.2.2:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} no permitido`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '5mb' }));
app.use('/api/auth',  authRoutes);
app.use('/api/tasks', tasksRoutes);

const start = async () => {
  await initDB();
  app.listen(3000, () => {
    console.log('API en :3000');
  });
};

start();
