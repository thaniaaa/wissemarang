const express = require('express');
const db = require('../models/db');
const verifyAdmin = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const router = express.Router();

// 🔹 Konfigurasi Multer untuk Upload File
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'wisataImage/'); // Pastikan folder 'wisataImage' ada
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Gunakan timestamp sebagai nama file
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File harus berupa gambar JPG atau PNG!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Maksimum 10MB
    fileFilter: fileFilter
});

// 🟢 PUBLIK: Lihat semua wisata
router.get('/', (req, res) => {
    const query = 'SELECT id, nama_tempat, kategori, foto, deskripsi, alamat, averageRating FROM wisata';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        console.log("Data yang dikirim ke frontend:", results); // Debugging
        res.json(results);
    });
});


router.get('/top', (req, res) => {
    const query = 'SELECT id, nama_tempat, kategori, foto, averageRating FROM wisata ORDER BY averageRating DESC Limit 8';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        console.log("Data yang dikirim ke frontend:", results); // Debugging
        res.json(results);
    });
});

router.get('/top/:kategori', (req, res) => {
    const { kategori } = req.params;  // Ambil kategori dari URL

    const query = 'SELECT id, nama_tempat, kategori, foto, averageRating FROM wisata WHERE kategori = ? ORDER BY averageRating DESC LIMIT 8';

    db.query(query, [kategori], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        console.log("Data yang dikirim ke frontend:", results); // Debugging
        res.json(results);  // Kirim hasil query dalam format JSON
    });
});


// 🟢 API: Ambil daftar wisata berdasarkan kategori (misal: Hotel, Kota Lama)
router.get('/kategori/:kategori', (req, res) => {
    const { kategori } = req.params;
    
    const query = 'SELECT id, nama_tempat, deskripsi, foto, averageRating FROM wisata WHERE kategori = ?';

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

// 🔹 API Tambah Wisata
router.post('/', verifyAdmin, upload.single('foto'), async (req, res) => {
    const { nama_tempat, kategori, deskripsi, alamat } = req.body;
    let fotoWisata = null;

    if (req.file) {
        console.log('File uploaded:', req.file);
        console.log('MIME type:', req.file.mimetype);
        console.log('File size:', req.file.size);

        // Tentukan path gambar yang diupload
        fotoWisata = `wisataImage/${req.file.filename}`;
    }

    // Query untuk memasukkan data wisata baru ke database
    const insertWisataQuery = 'INSERT INTO wisata (nama_tempat, kategori, deskripsi, foto, alamat) VALUES (?, ?, ?, ?, ?)';
    db.query(insertWisataQuery, [nama_tempat, kategori, deskripsi, fotoWisata, alamat], (err, result) => {
        if (err) {
            console.error('Error inserting wisata data:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({
            message: 'Wisata berhasil ditambahkan!',
            foto: fotoWisata ? `http://localhost:5000/wisataImage/${fotoWisata}` : null,
        });
    });
});


// 🔹 API Update Wisata Tanpa Kompresi Gambar
router.put('/:id', verifyAdmin, upload.single('foto'), async (req, res) => {
    const { id } = req.params;
    const { nama_tempat, kategori, deskripsi, alamat } = req.body;
    let fotoWisata = null;

    if (req.file) {
        console.log('File uploaded:', req.file);
        console.log('MIME type:', req.file.mimetype);
        console.log('File size:', req.file.size);

        // Tentukan path gambar yang diupload tanpa kompresi
        fotoWisata = `wisataImage/${req.file.filename}`;

        // Menghapus gambar wisata lama jika ada
        const getOldFotoQuery = 'SELECT foto FROM wisata WHERE id = ?';
        db.query(getOldFotoQuery, [id], async (err, result) => {
            if (err) {
                console.error('Error fetching old foto:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            const oldFoto = result[0] ? result[0].foto : null;

            // Hapus file lama jika ada
            if (oldFoto) {
                const oldFilePath = `wisataImage/${oldFoto}`;
                try {
                    if (fs.existsSync(oldFilePath)) {
                        await fsPromises.unlink(oldFilePath);  // Hapus gambar lama
                        console.log('Old foto deleted');
                    }
                } catch (error) {
                    console.error('Error deleting old foto:', error);
                }
            }

            // Update wisata dengan gambar yang sudah diupload
            const updateWisataQuery = 'UPDATE wisata SET nama_tempat = ?, kategori = ?, deskripsi = ?, foto = ?, alamat = ? WHERE id = ?';
            db.query(updateWisataQuery, [nama_tempat, kategori, deskripsi, fotoWisata, alamat, id], (err, result) => {
                if (err) {
                    console.error('Error updating wisata:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                    message: 'Wisata berhasil diperbarui!',
                    foto: `http://localhost:5000/wisataImage/${fotoWisata}`, // Kembalikan URL foto
                });
            });
        });
    } else {
        // Jika tidak ada foto yang di-upload, update data wisata tanpa mengubah foto
        const updateWisataQuery = 'UPDATE wisata SET nama_tempat = ?, kategori = ?, deskripsi = ?, alamat = ? WHERE id = ?';
        db.query(updateWisataQuery, [nama_tempat, kategori, deskripsi, alamat, id], (err, result) => {
            if (err) {
                console.error('Error updating wisata:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ message: 'Wisata berhasil diperbarui tanpa perubahan foto!' });
        });
    }
});


// 🔴 API Hapus Wisata
router.delete('/:id', verifyAdmin, (req, res) => {
    const { id } = req.params;

    // Query untuk menghapus data wisata berdasarkan ID
    const deleteWisataQuery = 'DELETE FROM wisata WHERE id = ?';
    
    db.query(deleteWisataQuery, [id], (err, result) => {
        if (err) {
            console.error('Error deleting wisata data:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Wisata tidak ditemukan!' });
        }

        res.json({ message: 'Wisata berhasil dihapus!' });
    });
});

// Endpoint untuk mendapatkan 5 wisata dengan rating tertinggi
router.get('/top-wisata', (req, res) => {
    const query = `SELECT * FROM wisata ORDER BY rating DESC LIMIT 5`;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Jika hasilnya kosong, berikan respons "Wisata tidak ditemukan"
        if (results.length === 0) {
            return res.status(404).json({ message: "Wisata tidak ditemukan" });
        }

        res.json(results);
    });
});


// Route untuk mendapatkan galeri gambar wisata berdasarkan wisata_id
router.get('/gallery/:wisataId', (req, res) => {
    const wisataId = req.params.wisataId;
    db.query('SELECT * FROM wisata_gallery WHERE wisata_id = ?', [wisataId], (err, results) => {
        if (err) {
            console.error("Error fetching gallery images:", err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'No images found for this wisata' });
        }
        res.json(results);  // Mengembalikan data dalam format JSON
    });
});


// Route untuk mendapatkan semua galeri gambar wisata
router.get('/gallery', (req, res) => {
    db.query('SELECT * FROM wisata_gallery', (err, results) => {
        if (err) {
            console.error("Error fetching gallery images:", err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'No images found for any wisata' });
        }
        res.json(results);  // Mengembalikan data dalam format JSON
    });
});


module.exports = router;
