const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middlewares/authMiddleware');
const sharp = require('sharp');
const fs = require('fs');
const fsPromises = require('fs').promises;

const router = express.Router();

// 🔹 Konfigurasi Multer untuk Upload File
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pastikan folder 'uploads' ada
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

// 🔹 API Register Manual
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: "Semua kolom harus diisi!" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Konfirmasi password tidak cocok!" });
    }

    try {
        // Cek apakah email sudah digunakan
        const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(checkUserQuery, [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length > 0) return res.status(400).json({ error: 'Email sudah digunakan!' });

            // Hash password sebelum disimpan
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) return res.status(500).json({ error: 'Gagal mengenkripsi password' });

                // Simpan user baru dengan role 'publik'
                const insertUserQuery = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, "publik")';

                db.query(insertUserQuery, [username, email, hashedPassword], (err, results) => {
                    if (err) return res.status(500).json({ error: 'Gagal menyimpan user' });

                    // Jika sukses, buat token JWT
                    const token = jwt.sign({ id: results.insertId, username: username, email: email, role: 'publik' }, "SECRET_KEY", { expiresIn: "1h" });
                    res.status(201).json({ message: 'Registrasi berhasil!', token });
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: "Kesalahan server!" });
    }
});

// 🔹 API Login Manual
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email dan password harus diisi!" });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(401).json({ error: 'User tidak ditemukan' });

        const user = results[0];

        // Jika user hanya punya Google ID, tidak boleh login dengan password
        if (!user.password) {
            return res.status(401).json({ error: 'Gunakan login Google untuk akun ini!' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).json({ error: 'Password salah' });

        const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, "SECRET_KEY", { expiresIn: "1h" });
        res.json({ message: "Login berhasil", token });
    });
});

// 🔹 API Ambil Data Profil User
router.get('/profile', verifyToken, (req, res) => {
    const userId = req.user.id;

    db.query("SELECT username, email, created_at, role, profile_picture FROM users WHERE id = ?", [userId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error!" });
        if (results.length === 0) return res.status(404).json({ error: "User tidak ditemukan!" });

        const user = results[0];

        // Jika ada gambar profil, buat URL yang benar
        let profilePictureUrl = user.profile_picture
            ? `http://localhost:5000/uploads/${path.basename(user.profile_picture)}`
            : "assets/images/default-profile.png";

        res.json({
            username: user.username,
            email: user.email,
            created_at: user.created_at,
            role: user.role,
            profile_picture: profilePictureUrl
        });
    });
});


// 🔹 API Update Profil dengan Kompresi Gambar
router.put('/profile', verifyToken, upload.single('profile_picture'), async (req, res) => {
    try {
        const userId = req.user.id;
        const { username } = req.body;
        let profilePicture = null;

        if (req.file) {
            console.log('File uploaded:', req.file);
            console.log('MIME type:', req.file.mimetype);
            console.log('File size:', req.file.size);

            const imagePath = `uploads/${req.file.filename}`;
            const compressedPath = `uploads/compressed_${req.file.filename.replace(path.extname(req.file.filename), '.jpeg')}`;
        
            try {
                console.log('Processing image:', imagePath);  // Log untuk debugging
        
                await sharp(imagePath)
                    .resize(300, 300, { fit: 'cover' })
                    .jpeg({ quality: 80 })  // Kompresi JPEG
                    .toFile(compressedPath);

                // Update profil dengan gambar baru
                profilePicture = compressedPath;

                // Menghapus gambar profil lama jika ada
                const getOldProfileQuery = 'SELECT profile_picture FROM users WHERE id = ?';
                db.query(getOldProfileQuery, [userId], async (err, result) => {
                    if (err) {
                        console.error('Error fetching old profile picture:', err);
                        return res.status(500).json({ error: 'Database error' });
                    }

                    const oldProfilePicture = result[0] ? result[0].profile_picture : null;

                    // Hapus file lama jika ada
                    if (oldProfilePicture) {
                        const oldFilePath = `uploads/${oldProfilePicture}`;
                        try {
                            if (fs.existsSync(oldFilePath)) {
                                await fsPromises.unlink(oldFilePath);  // Hapus gambar lama
                                console.log('Old profile picture deleted');
                            }
                        } catch (error) {
                            console.error('Error deleting old profile picture:', error);
                        }
                    }

                    // Update profil user dengan gambar yang sudah diproses
                    const updateProfileQuery = 'UPDATE users SET username = ?, profile_picture = ? WHERE id = ?';
                    db.query(updateProfileQuery, [username, profilePicture, userId], (err, result) => {
                        if (err) {
                            console.error('Error updating profile:', err);
                            return res.status(500).json({ error: 'Database error' });
                        }

                        res.json({
                            message: 'Profil berhasil diperbarui!',
                            profile_picture: `http://localhost:5000/${profilePicture}`,
                        });
                    });
                });
            } catch (error) {
                console.error('Error processing image:', error);  // Menangani error kompresi
                return res.status(500).json({ error: 'Gagal memproses gambar!' });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal memperbarui profil!' });
    }
});


// 🔹 API Ambil Semua Data Pengguna
router.get('/users', (req, res) => {
    db.query("SELECT id, username, email, created_at, role, profile_picture FROM users", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error!" });

        if (results.length === 0) {
            return res.status(404).json({ error: "Tidak ada pengguna ditemukan!" });
        }

        const users = results.map(user => {
            let profilePictureUrl = user.profile_picture
                ? `http://localhost:5000/uploads/${path.basename(user.profile_picture)}`
                : "assets/images/default-profile.png";  // Gambar default jika tidak ada foto

            return {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
                role: user.role,
                profile_picture: profilePictureUrl
            };
        });

        res.json(users);  // Mengirimkan data semua pengguna
    });
});

// 🔹 API Mengambil Data Pengguna Berdasarkan ID
router.get('/users/:id', (req, res) => {
    const userId = req.params.id; // Mengambil ID pengguna dari URL params

    // Query untuk mengambil data pengguna berdasarkan ID
    const query = 'SELECT id, username, email, role, created_at, profile_picture FROM users WHERE id = ?';
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan!' });
        }

        // Mengembalikan data pengguna dalam format JSON
        const user = results[0];

        // Menyusun respons
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            profile_picture: user.profile_picture ? `http://localhost:5000/uploads/${user.profile_picture}` : null, // Jika ada foto, kirimkan URLnya
        });
    });
});



module.exports = router;
