import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { rows } = await pool.query(
      'SELECT id, email, avatar FROM users WHERE id = $1', [userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { avatar } = req.body;
    if (!avatar || typeof avatar !== 'string')
      return res.status(400).json({ error: 'Avatar inválido' });
    await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, userId]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Contraseña requerida' });
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    const ok = await bcrypt.compare(password, rows[0].password);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const changeEmail = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { newEmail, password } = req.body;
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail))
      return res.status(400).json({ error: 'Correo inválido' });
    const { rows: taken } = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2', [newEmail, userId]
    );
    if (taken[0]) return res.status(409).json({ error: 'Este correo ya está registrado' });
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    const ok = await bcrypt.compare(password, rows[0].password);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });
    await pool.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, userId]);
    res.json({ ok: true, email: newEmail });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    const ok = await bcrypt.compare(currentPassword, rows[0].password);
    if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, userId]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

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