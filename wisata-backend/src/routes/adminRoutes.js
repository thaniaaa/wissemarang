const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const verifyAdmin = require('../middlewares/authMiddleware');

const router = express.Router();

// 🔹 Admin Login
    router.post('/login', (req, res) => {
        const { email, password } = req.body;

        const query = 'SELECT * FROM users WHERE email = ?';
        db.query(query, [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length === 0) return res.status(401).json({ error: 'User tidak ditemukan' });

            const user = results[0];

            // Pastikan hanya admin atau superadmin yang bisa login
            if (user.role !== "admin" && user.role !== "superadmin") {
                return res.status(403).json({ error: "Akses hanya untuk Admin & Superadmin!" });
            }

            // Bandingkan password yang diinput dengan hash di database
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) return res.status(401).json({ error: 'Password salah' });

            // Jika password cocok, buat token JWT
            const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, "SECRET_KEY", { expiresIn: "1h" });
            res.json({ message: "Login berhasil", token });
        });
    });


/// 🔴 Hanya Super Admin yang Bisa Mendaftarkan Admin Baru
    router.post('/register', verifyAdmin, (req, res) => {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Semua kolom harus diisi!" });
        }

        if (!["admin", "user"].includes(role)) {
            return res.status(400).json({ error: "Hanya bisa membuat akun admin atau user!" });
        }

        // Pastikan hanya Super Admin yang bisa membuat admin baru
        if (req.user.role !== "superadmin" && role === "admin") {
            return res.status(403).json({ error: "Hanya Super Admin yang bisa menambah Admin!" });
        }

        // Cek apakah email sudah digunakan
        const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(checkUserQuery, [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length > 0) return res.status(400).json({ error: 'Email sudah digunakan!' });

            // Hash password sebelum disimpan
            const hashedPassword = await bcrypt.hash(password, 10);

            const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
            db.query(query, [username, email, hashedPassword, role], (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.status(201).json({ message: 'User berhasil ditambahkan!' });
            });
        });
    });


module.exports = router;
