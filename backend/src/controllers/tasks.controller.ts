import { Request, Response } from 'express';
import { pool } from '../db';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [(req as any).userId]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { titulo } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO tasks(user_id, titulo) VALUES($1, $2) RETURNING *',
      [(req as any).userId, titulo]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { completada, titulo } = req.body;
    const { rows } = await pool.query(
      `UPDATE tasks SET
        completada = COALESCE($1, completada),
        titulo     = COALESCE($2, titulo)
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [completada ?? null, titulo ?? null, req.params.id, (req as any).userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No encontrada' });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [req.params.id, (req as any).userId]
    );
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};