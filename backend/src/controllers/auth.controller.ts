import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AVATAR_BYTES = 512_000; // ~375 KB imagen original en base64

// ── Helpers ────────────────────────────────────────────────────────────────
const serverError = (res: Response, e: unknown) => {
  console.error(e);
  return res.status(500).json({ error: 'Error interno del servidor' });
};

// ── Controllers ────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !EMAIL_RE.test(email))
      return res.status(400).json({ error: 'Correo inválido' });
    if (!password || typeof password !== 'string' || password.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users(email, password) VALUES($1, $2) RETURNING id, email',
      [email.toLowerCase().trim(), hash]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) {
    // 23505 = unique_violation (email duplicado)
    if (e.code === '23505')
      return res.status(409).json({ error: 'Este correo ya está registrado' });
    return serverError(res, e);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });

    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [String(email).toLowerCase().trim()]
    );
    if (!rows[0])
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, rows[0].password);
    if (!ok)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { userId: rows[0].id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (e) {
    return serverError(res, e);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { rows } = await pool.query(
      'SELECT id, email, avatar FROM users WHERE id = $1', [userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    return serverError(res, e);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Contraseñas requeridas' });
    if (typeof newPassword !== 'string' || newPassword.length < 6)
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });

    const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ok = await bcrypt.compare(currentPassword, rows[0].password);
    if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, userId]);
    res.json({ ok: true });
  } catch (e) {
    return serverError(res, e);
  }
};

export const changeEmail = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { newEmail, password } = req.body;

    if (!newEmail || !EMAIL_RE.test(newEmail))
      return res.status(400).json({ error: 'Correo inválido' });
    if (!password)
      return res.status(400).json({ error: 'Contraseña requerida' });

    const normalizedEmail = newEmail.toLowerCase().trim();

    const { rows: taken } = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2', [normalizedEmail, userId]
    );
    if (taken[0]) return res.status(409).json({ error: 'Este correo ya está registrado' });

    const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ok = await bcrypt.compare(password, rows[0].password);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });

    await pool.query('UPDATE users SET email = $1 WHERE id = $2', [normalizedEmail, userId]);
    res.json({ ok: true, email: normalizedEmail });
  } catch (e) {
    return serverError(res, e);
  }
};

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { avatar } = req.body;

    if (!avatar || typeof avatar !== 'string')
      return res.status(400).json({ error: 'Avatar inválido' });
    if (avatar.length > MAX_AVATAR_BYTES)
      return res.status(400).json({ error: 'Imagen demasiado grande (máx ~375 KB)' });

    await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, userId]);
    res.json({ ok: true });
  } catch (e) {
    return serverError(res, e);
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: 'Contraseña requerida' });

    const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ok = await bcrypt.compare(password, rows[0].password);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ ok: true });
  } catch (e) {
    return serverError(res, e);
  }
};
