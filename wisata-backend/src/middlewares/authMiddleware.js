const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.header("Authorization");
    console.log("Header Authorization:", authHeader);

    if (!authHeader) {
        return res.status(401).json({ error: "Unauthorized, token tidak ditemukan!" });
    }

    const token = authHeader.split(" ")[1]; // Ambil token setelah "Bearer"
    console.log("Token yang diterima:", token);

    try {
        const decoded = jwt.verify(token, "SECRET_KEY");
        console.log("Decoded Token:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Error:", error);
        res.status(400).json({ error: "Token tidak valid!" });
    }
};

module.exports = verifyToken;
