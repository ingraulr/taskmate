"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// POST /auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                message: "Email y contraseña son requeridos",
            });
        }
        // Aquí después conectas la lógica real con DB
        return res.status(200).json({
            ok: true,
            message: "Login exitoso",
            token: "fake-jwt-token",
            user: {
                id: 1,
                email,
                fullName: "Usuario Demo",
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error interno en login",
        });
    }
});
// POST /auth/register
router.post("/register", async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({
                ok: false,
                message: "Nombre, email y contraseña son requeridos",
            });
        }
        // Aquí después conectas la lógica real con DB
        return res.status(201).json({
            ok: true,
            message: "Usuario registrado correctamente",
            user: {
                id: 2,
                fullName,
                email,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error interno en registro",
        });
    }
});
exports.default = router;
