import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      email      VARCHAR(200) UNIQUE NOT NULL,
      password   VARCHAR(200) NOT NULL,
      avatar     TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id         SERIAL PRIMARY KEY,
      user_id    INT REFERENCES users(id)
                 ON DELETE CASCADE,
      titulo     VARCHAR(200) NOT NULL,
      completada BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
  `);
  console.log('Base de datos lista');
};