const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const verifyAdmin = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// 🔹 API Menambah Pengguna Baru oleh Admin
router.post('/users', verifyAdmin, (req, res) => {
    const { username, email, password, confirmPassword, role } = req.body;

    // Validasi input
    if (!username || !email || !password || !confirmPassword || !role) {
        return res.status(400).json({ error: "Semua kolom harus diisi!" });
    }

    // Pastikan password dan konfirmasi password cocok
    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Password dan konfirmasi password tidak cocok!" });
    }

    // Cek apakah email sudah digunakan
    const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkUserQuery, [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length > 0) return res.status(400).json({ error: 'Email sudah digunakan!' });

        // Hash password sebelum disimpan
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ error: 'Gagal mengenkripsi password' });

            // Simpan user baru dengan role yang dipilih
            const insertUserQuery = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
            db.query(insertUserQuery, [username, email, hashedPassword, role], (err, results) => {
                if (err) return res.status(500).json({ error: 'Gagal menyimpan user' });

                // Buat JWT token
                const token = jwt.sign({
                    id: results.insertId,
                    username: username,
                    email: email,
                    role: role
                }, "SECRET_KEY", { expiresIn: "1h" });

                res.status(201).json({ message: 'Pengguna berhasil ditambahkan!', token });
            });
        });
    });
});


// 🔹 API Update User by Admin
router.put('/users/:id', verifyAdmin, (req, res) => {
    const userId = req.params.id;  // Mendapatkan ID pengguna dari parameter URL
    const { username, email, role, password } = req.body;  // Mendapatkan data user yang diubah dari body
    
    // Validate input (Pastikan username, email, dan role ada)
    if (!username || !email || !role) {
        return res.status(400).json({ error: 'Semua kolom harus diisi!' });
    }

    // Ambil data user lama dari database
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Gagal mengambil data user' });
        if (result.length === 0) return res.status(404).json({ error: 'User tidak ditemukan!' });

        const existingUser = result[0];  // Mengambil data user lama

        // Siapkan data yang akan diperbarui
        let updatedData = {
            username,
            email,
            role,
        };

        // Jika password diubah, hash password baru
        if (password) {
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) return res.status(500).json({ error: 'Gagal mengenkripsi password' });

                updatedData.password = hashedPassword;  // Tambahkan password yang telah di-hash ke data yang diperbarui
                updateUserInDatabase(userId, updatedData, res);  // Lanjutkan update ke database
            });
        } else {
            // Jika password tidak diubah, gunakan password lama
            updatedData.password = existingUser.password;  // Pastikan password lama tetap dipertahankan
            updateUserInDatabase(userId, updatedData, res);  // Lanjutkan update ke database
        }
    });
});

// Helper function untuk melakukan update data pengguna di database
const updateUserInDatabase = (userId, updatedData, res) => {
    const query = 'UPDATE users SET username = ?, email = ?, role = ?, password = ? WHERE id = ?';

    // Eksekusi query untuk memperbarui data pengguna
    db.query(query, [updatedData.username, updatedData.email, updatedData.role, updatedData.password, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan!' });
        }

        res.json({
            message: 'Pengguna berhasil diperbarui!',
        });
    });
};


// 🔹 API Delete User by ID
router.delete('/users/:id', verifyAdmin, (req, res) => {
    const userId = req.params.id;

    // Query to delete the user by ID
    const query = 'DELETE FROM users WHERE id = ?';

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Terjadi kesalahan saat menghapus pengguna' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan!' });
        }

        // Return success message
        res.json({ message: 'Pengguna berhasil dihapus!' });
    });
});


module.exports = router;
