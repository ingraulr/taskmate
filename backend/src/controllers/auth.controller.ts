import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

export const register = async (
  req: Request, res: Response
) => {
  try {
    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users(email, password)
       VALUES($1, $2) RETURNING id, email`,
      [email, hash]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const login = async (
  req: Request, res: Response
) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (!rows[0]) return res.status(401)
      .json({ error: 'No encontrado' });
    const ok = await bcrypt.compare(password, rows[0].password);
    if (!ok) return res.status(401)
      .json({ error: 'Contraseña incorrecta' });
    const token = jwt.sign(
      { userId: rows[0].id }, process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};