import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes  from './routes/auth.routes';
import tasksRoutes from './routes/tasks.routes';
import { initDB } from './db';

dotenv.config();
const app = express();
app.use(cors());
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