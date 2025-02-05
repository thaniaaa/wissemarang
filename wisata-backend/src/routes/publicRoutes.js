const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middlewares/authMiddleware');
const sharp = require('sharp');
const fs = require('fs');

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

                // Simpan user baru dengan role 'user'
                const insertUserQuery = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, "user")';
                db.query(insertUserQuery, [username, email, hashedPassword], (err, results) => {
                    if (err) return res.status(500).json({ error: 'Gagal menyimpan user' });

                    // Jika sukses, buat token JWT
                    const token = jwt.sign({ id: results.insertId, username, email, role: 'user' }, "SECRET_KEY", { expiresIn: "1h" });
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

    db.query("SELECT username, email, created_at, profile_picture FROM users WHERE id = ?", [userId], (err, results) => {
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
            const imagePath = `uploads/${req.file.filename}`;
            const compressedPath = `uploads/compressed_${req.file.filename}`;

            // Kompresi gambar jika lebih besar dari 500KB
            await sharp(imagePath)
                .resize(300, 300, { fit: 'cover' })
                .jpeg({ quality: 80 }) // Kompres kualitas menjadi 80%
                .toFile(compressedPath);

            // Hapus file asli jika sudah dikompresi
            fs.unlinkSync(imagePath);

            profilePicture = compressedPath;
        }

        // Update hanya jika ada perubahan username atau gambar
        const query = 'UPDATE users SET username = ?, profile_picture = COALESCE(?, profile_picture) WHERE id = ?';
        db.query(query, [username, profilePicture, userId], (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            res.json({
                message: 'Profil berhasil diperbarui!',
                profile_picture: profilePicture ? `http://localhost:5000/${profilePicture}` : null
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal memperbarui profil!' });
    }
});

module.exports = router;
