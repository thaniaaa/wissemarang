const express = require('express');
const db = require('../models/db');

const router = express.Router();

// 🟢 PUBLIK: Ambil semua review berdasarkan wisata_id
router.get('/:wisata_id', (req, res) => {
    const { wisata_id } = req.params;

    const query = 'SELECT * FROM reviews WHERE wisata_id = ? ORDER BY created_at DESC';
    db.query(query, [wisata_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        res.json(results);
    });
});

// 🟢 PUBLIK: Tambah review untuk tempat wisata
router.post('/', (req, res) => {
    const { wisata_id, username, review, rating } = req.body;

    if (!wisata_id || !username || !review || !rating) {
        return res.status(400).json({ error: "Semua field harus diisi!" });
    }

    const query = 'INSERT INTO reviews (wisata_id, username, review, rating) VALUES (?, ?, ?, ?)';
    db.query(query, [wisata_id, username, review, rating], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        res.status(201).json({ message: "Review berhasil ditambahkan!", review_id: results.insertId });
    });
});

module.exports = router;
