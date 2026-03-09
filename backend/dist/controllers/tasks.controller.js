"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.createTask = exports.getTasks = void 0;
const db_1 = require("../db");
const getTasks = async (req, res) => {
    const { rows } = await db_1.pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json(rows);
};
exports.getTasks = getTasks;
const createTask = async (req, res) => {
    const { titulo } = req.body;
    const { rows } = await db_1.pool.query('INSERT INTO tasks(user_id, titulo) VALUES($1, $2) RETURNING *', [req.userId, titulo]);
    res.status(201).json(rows[0]);
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
    const { completada } = req.body;
    const { rows } = await db_1.pool.query('UPDATE tasks SET completada = $1 WHERE id = $2 AND user_id = $3 RETURNING *', [completada, req.params.id, req.userId]);
    if (!rows[0])
        return res.status(404).json({ error: 'No encontrada' });
    res.json(rows[0]);
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    await db_1.pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.status(204).send();
};
exports.deleteTask = deleteTask;
