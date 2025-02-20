const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Pastikan file db.js sesuai dengan path yang benar
const path = require('path');
const verifyToken = require('../middlewares/authMiddleware');

// Menambahkan wisata ke favorit
router.post('/:user_id/:wisata_id', verifyToken, (req, res) => {
    const user_id = req.params.user_id;  // Ambil user_id dari URL params
    const wisata_id = req.params.wisata_id; // Ambil wisata_id dari URL params

    console.log("Received user_id:", user_id, "and wisata_id:", wisata_id);  // Log user_id dan wisata_id

    const checkQuery = 'SELECT * FROM favorite_wisata WHERE user_id = ? AND wisata_id = ?';
    db.query(checkQuery, [user_id, wisata_id], (err, results) => {
        if (err) {
            console.error("Error checking favorite:", err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: 'Wisata sudah ada di favorit Anda' });
        }

        const query = 'INSERT INTO favorite_wisata (user_id, wisata_id, created_at) VALUES (?, ?, NOW())';
        db.query(query, [user_id, wisata_id], (err, result) => {
            if (err) {
                console.error("Error adding to favorite:", err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message: 'Wisata berhasil ditambahkan ke favorit' });
        });
    });
});


// Mendapatkan semua wisata favorit berdasarkan user
router.get('/:user_id', verifyToken, (req, res) => { // Gunakan verifyToken di sini
    const user_id = req.user.id; // Ambil ID user dari middleware verifyToken

    const query = `
        SELECT w.id, w.nama_tempat, w.kategori, w.foto, w.alamat, w.averageRating
        FROM favorite_wisata fw
        JOIN wisata w ON fw.wisata_id = w.id
        WHERE fw.user_id = ?
    `;
    db.query(query, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Tidak ada wisata favorit' });
        }
        res.json(results);
    });
});

// Menghapus wisata dari favorit
router.delete('/:user_id/:wisata_id', verifyToken, (req, res) => {
    const { wisata_id, user_id } = req.params;

    // Cek apakah wisata ada di favorit user
    const checkQuery = 'SELECT * FROM favorite_wisata WHERE user_id = ? AND wisata_id = ?';
    db.query(checkQuery, [user_id, wisata_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Wisata tidak ditemukan di favorit Anda' });
        }

        // Menghapus wisata dari tabel favorite_wisata
        const deleteQuery = 'DELETE FROM favorite_wisata WHERE user_id = ? AND wisata_id = ?';
        db.query(deleteQuery, [user_id, wisata_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(200).json({ message: 'Wisata berhasil dihapus dari favorit' });
        });
    });
});

module.exports = router;
