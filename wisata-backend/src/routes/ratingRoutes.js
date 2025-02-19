const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Pastikan file db.js sesuai dengan path yang benar
const verifyToken = require('../middlewares/authMiddleware');

// Menambahkan atau memperbarui rating dan ulasan
router.post('/:wisata_id', verifyToken, (req, res) => {
    const { wisata_id } = req.params;
    const user_id = req.user.id;  // Mengambil user_id dari token yang sudah didecode
    const { rating, reviewText } = req.body;

    // Tidak ada lagi pengecekan untuk update, langsung insert review baru
    const insertQuery = 'INSERT INTO ratings (user_id, wisata_id, rating, review_text, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())';
    db.query(insertQuery, [user_id, wisata_id, rating, reviewText], (err, result) => {
        if (err) {
            console.error("Error adding rating:", err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Rating berhasil ditambahkan' });
    });
});



// Mendapatkan semua rating dan review berdasarkan wisata_id (tanpa perlu login)
router.get('/:wisata_id', (req, res) => {
    const { wisata_id } = req.params;

    // Query untuk mengambil rating, review_text, username dan tanggal
    const query = `
        SELECT 
            r.rating, 
            r.review_text, 
            r.created_at, 
            u.username
        FROM 
            ratings r
        LEFT JOIN 
            users u ON r.user_id = u.id
        WHERE 
            r.wisata_id = ?
    `;
    
    db.query(query, [wisata_id], (err, results) => {
        if (err) {
            console.error("Error fetching rating:", err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Rating atau review tidak ditemukan' });
        }
        
        // Mengembalikan hasil query yang mencakup username, rating, review_text, dan created_at
        res.json(results);  // Results should contain the expected data now
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
