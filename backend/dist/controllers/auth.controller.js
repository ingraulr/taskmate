"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const register = async (req, res) => {
    const { email, password } = req.body;
    const hash = await bcryptjs_1.default.hash(password, 10);
    const { rows } = await db_1.pool.query(`INSERT INTO users(email, password)
     VALUES($1, $2) RETURNING id, email`, [email, hash]);
    res.status(201).json(rows[0]);
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    const { rows } = await db_1.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows[0])
        return res.status(401)
            .json({ error: 'No encontrado' });
    const ok = await bcryptjs_1.default.compare(password, rows[0].password);
    if (!ok)
        return res.status(401)
            .json({ error: 'Contraseña incorrecta' });
    const token = jsonwebtoken_1.default.sign({ userId: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
};
exports.login = login;
