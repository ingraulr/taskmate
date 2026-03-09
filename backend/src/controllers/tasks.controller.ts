import { Request, Response } from 'express';
import { pool } from '../db';

const VALID_PRIORIDADES = ['baja', 'media', 'alta', 'urgente'];

const serverError = (res: Response, e: unknown) => {
  console.error(e);
  return res.status(500).json({ error: 'Error interno del servidor' });
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM tasks WHERE user_id = $1
       ORDER BY
         completada ASC,
         CASE prioridad
           WHEN 'urgente' THEN 1
           WHEN 'alta'    THEN 2
           WHEN 'media'   THEN 3
           WHEN 'baja'    THEN 4
           ELSE 5
         END ASC,
         created_at DESC`,
      [(req as any).userId]
    );
    res.json(rows);
  } catch (e) {
    return serverError(res, e);
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { titulo } = req.body;

    if (!titulo || typeof titulo !== 'string' || titulo.trim().length < 1)
      return res.status(400).json({ error: 'El título es requerido' });
    if (titulo.trim().length > 200)
      return res.status(400).json({ error: 'El título no puede superar 200 caracteres' });

    const { rows } = await pool.query(
      'INSERT INTO tasks(user_id, titulo) VALUES($1, $2) RETURNING *',
      [(req as any).userId, titulo.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    return serverError(res, e);
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { completada, titulo, prioridad, tiempo_limite } = req.body;

    let query: string;
    let params: any[];

    if (completada !== undefined) {
      // toggle completada
      if (typeof completada !== 'boolean')
        return res.status(400).json({ error: 'Valor de completada inválido' });

      query = `UPDATE tasks SET completada = $1 WHERE id = $2 AND user_id = $3 RETURNING *`;
      params = [completada, req.params.id, userId];

    } else {
      // full edit: titulo + prioridad (nullable) + tiempo_limite (nullable)
      if (!titulo || typeof titulo !== 'string' || titulo.trim().length < 1)
        return res.status(400).json({ error: 'El título es requerido' });
      if (titulo.trim().length > 200)
        return res.status(400).json({ error: 'El título no puede superar 200 caracteres' });
      if (prioridad !== null && prioridad !== undefined && !VALID_PRIORIDADES.includes(prioridad))
        return res.status(400).json({ error: 'Prioridad inválida' });
      if (tiempo_limite !== null && tiempo_limite !== undefined) {
        if (typeof tiempo_limite !== 'number' || !Number.isInteger(tiempo_limite) || tiempo_limite < 1 || tiempo_limite > 1440)
          return res.status(400).json({ error: 'Tiempo límite inválido (1–1440 minutos)' });
      }

      query = `UPDATE tasks
               SET titulo = $1, prioridad = $2, tiempo_limite = $3
               WHERE id = $4 AND user_id = $5
               RETURNING *`;
      params = [titulo.trim(), prioridad ?? null, tiempo_limite ?? null, req.params.id, userId];
    }

    const { rows } = await pool.query(query, params);
    if (!rows[0]) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    return serverError(res, e);
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, (req as any).userId]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Tarea no encontrada' });
    res.status(204).send();
  } catch (e) {
    return serverError(res, e);
  }
};
