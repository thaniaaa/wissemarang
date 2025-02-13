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
    const userId = req.params.id; // Get the user ID from the URL parameter
    const { username, email, role, password } = req.body; // Get the updated user data from the body
    
    // Validate input
    if (!username || !email || !role) {
        return res.status(400).json({ error: 'Semua kolom harus diisi!' });
    }

    // If a password is provided, hash it
    let updatedData = {
        username,
        email,
        role,
    };

    if (password) {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ error: 'Gagal mengenkripsi password' });

            updatedData.password = hashedPassword; // Add the hashed password to the update object

            // Proceed with the update query
            updateUserInDatabase(userId, updatedData, res);
        });
    } else {
        // If no password is provided, just update other fields
        updateUserInDatabase(userId, updatedData, res);
    }
});

// Helper function to update the user in the database
const updateUserInDatabase = (userId, updatedData, res) => {
    const query = 'UPDATE users SET username = ?, email = ?, role = ?, password = ? WHERE id = ?';

    // Execute the update query
    db.query(query, [updatedData.username, updatedData.email, updatedData.role, updatedData.password || null, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan!' });
        }

        // Successfully updated
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
