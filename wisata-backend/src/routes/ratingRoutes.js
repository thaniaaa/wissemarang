const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Pastikan file db.js sesuai dengan path yang benar
const verifyToken = require('../middlewares/authMiddleware');

// Menambahkan atau memperbarui rating dan ulasan
router.post('/:wisata_id', verifyToken,  (req, res) => {
    const { wisata_id } = req.params;  // Mengambil wisata_id dari URL params
    const user_id = req.user.id;  // Mengambil user_id dari token yang sudah didecode
    const { rating, reviewText } = req.body;  // Mengambil rating dan review dari body

    // Cek apakah user sudah memberikan rating untuk wisata ini
    const checkQuery = 'SELECT * FROM ratings WHERE user_id = ? AND wisata_id = ?';
    db.query(checkQuery, [user_id, wisata_id], (err, results) => {
        if (err) {
            console.error("Error checking rating:", err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length > 0) {
            // Jika sudah ada, update rating
            const updateQuery = 'UPDATE ratings SET rating = ?, review_text = ?, updated_at = NOW() WHERE user_id = ? AND wisata_id = ?';
            db.query(updateQuery, [rating, reviewText, user_id, wisata_id], (err, result) => {
                if (err) {
                    console.error("Error updating rating:", err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(200).json({ message: 'Rating berhasil diperbarui' });
            });
        } else {
            // Jika belum ada, tambahkan rating baru
            const insertQuery = 'INSERT INTO ratings (user_id, wisata_id, rating, review_text, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())';
            db.query(insertQuery, [user_id, wisata_id, rating, reviewText], (err, result) => {
                if (err) {
                    console.error("Error adding rating:", err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({ message: 'Rating berhasil ditambahkan' });
            });
        }
    });
});

// Mendapatkan semua rating dan review berdasarkan wisata_id (tanpa perlu login)
router.get('/:wisata_id', (req, res) => {
    const { wisata_id } = req.params;

    const query = 'SELECT user_id, rating, review_text FROM ratings WHERE wisata_id = ?';
    db.query(query, [wisata_id], (err, results) => {
        if (err) {
            console.error("Error fetching rating:", err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Rating atau review tidak ditemukan' });
        }
        res.json(results); // Mengembalikan semua review dan rating untuk wisata tertentu
    });
});



// Mendapatkan semua rating untuk sebuah wisata (misalnya untuk menampilkan rata-rata)
router.get('/wisata/:wisata_id', (req, res) => {
    const { wisata_id } = req.params;

    const query = 'SELECT AVG(rating) AS averageRating, COUNT(*) AS totalRatings FROM ratings WHERE wisata_id = ?';
    db.query(query, [wisata_id], (err, results) => {
        if (err) {
            console.error("Error fetching average rating:", err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Rating tidak ditemukan untuk wisata ini' });
        }
        res.json(results[0]);
    });
});

module.exports = router;
