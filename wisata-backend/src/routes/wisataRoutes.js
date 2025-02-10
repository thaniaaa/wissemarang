const express = require('express');
const db = require('../models/db');
const verifyAdmin = require('../middlewares/authMiddleware');

const router = express.Router();

// 🟢 PUBLIK: Lihat semua wisata
router.get('/', (req, res) => {
    const query = 'SELECT id, nama_tempat, kategori, foto, deskripsi, alamat, rating FROM wisata';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        console.log("Data yang dikirim ke frontend:", results); // Debugging
        res.json(results);
    });
});


// 🟢 API: Ambil daftar wisata berdasarkan kategori (misal: Hotel, Kota Lama)
router.get('/kategori/:kategori', (req, res) => {
    const { kategori } = req.params;
    
    const query = 'SELECT nama_tempat, deskripsi, foto, rating FROM wisata WHERE kategori = ?';

    db.query(query, [kategori], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) return res.status(404).json({ message: 'Kategori wisata tidak ditemukan' });

        res.json(results);
    });
});



// 🟢 PUBLIK: Lihat wisata berdasarkan ID
router.get('/:id', (req, res) => {  // ✅ Perbaiki endpoint
    const { id } = req.params;
    const queryWisata = 'SELECT * FROM wisata WHERE id = ?';  // ✅ Ganti `tempat_wisata` ke `wisata`
    const queryReviews = 'SELECT * FROM reviews WHERE wisata_id = ? ORDER BY created_at DESC';

    db.query(queryWisata, [id], (err, wisataResults) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (wisataResults.length === 0) return res.status(404).json({ message: 'Wisata tidak ditemukan' });

        db.query(queryReviews, [id], (err, reviewResults) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            res.json({
                ...wisataResults[0],
                reviews: reviewResults
            });
        });
    });
});

// 🔴 ADMIN: Tambah Wisata
const Joi = require('joi');

router.post('/', verifyAdmin, (req, res) => {
    const schema = Joi.object({
        nama: Joi.string().min(3).required(),
        lokasi: Joi.string().required(),
        deskripsi: Joi.string().required(),
        foto: Joi.string().uri().required(),
        kategori: Joi.string().valid('Hotel', 'Kuliner', 'Oleh-Oleh', 'Spa', 'Objek Wisata', 'Tempat Nongkrong', 'Kota Lama').required(),
        rating: Joi.number().min(0).max(5).required()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { nama, lokasi, deskripsi, foto, kategori, rating } = req.body;
    const query = 'INSERT INTO wisata (nama, lokasi, deskripsi, foto, kategori, rating) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(query, [nama, lokasi, deskripsi, foto, kategori, rating], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        res.status(201).json({ message: 'Wisata berhasil ditambahkan!', id: results.insertId });
    });
});

// 🔴 ADMIN: Edit wisata
router.put('/:id', verifyAdmin, (req, res) => {
    const { id } = req.params;
    const { nama, lokasi, deskripsi, foto, kategori, rating } = req.body;
    
    const query = 'UPDATE wisata SET nama = ?, lokasi = ?, deskripsi = ?, foto = ?, kategori = ?, rating = ? WHERE id = ?';

    db.query(query, [nama, lokasi, deskripsi, foto, kategori, rating, id], (err) => {  // ✅ Pastikan semua parameter dikirim
        if (err) return res.status(500).json({ error: 'Database error' });

        res.json({ message: 'Wisata berhasil diperbarui!' });
    });
});

// 🔴 ADMIN: Hapus wisata
router.delete('/:id', verifyAdmin, (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM wisata WHERE id = ?';

    db.query(query, [id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        res.json({ message: 'Wisata berhasil dihapus!' });
    });
});

module.exports = router;
