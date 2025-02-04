const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ error: "Akses ditolak! Token tidak ditemukan." });
    }

    try {
        const decoded = jwt.verify(token, "SECRET_KEY");
        
        // Cek apakah user adalah admin atau superadmin
        if (decoded.role !== "admin" && decoded.role !== "superadmin") {
            return res.status(403).json({ error: "Akses ditolak! Hanya admin yang dapat mengakses." });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: "Token tidak valid!" });
    }
};

module.exports = verifyAdmin;
