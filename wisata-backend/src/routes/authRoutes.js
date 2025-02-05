const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// 🔹 Konfigurasi Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,  
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    const { id, displayName, emails } = profile;
    const email = emails[0].value;

    try {
        const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(checkUserQuery, [email], async (err, results) => {
            if (err) return done(err);

            if (results.length > 0) {
                return done(null, results[0]); // Jika user sudah ada, langsung login
            } else {
                const insertUserQuery = 'INSERT INTO users (username, email, google_id, role) VALUES (?, ?, ?, "user")';
                db.query(insertUserQuery, [displayName, email, id], (err, results) => {
                    if (err) return done(err);
                    return done(null, { id: results.insertId, username: displayName, email });
                });
            }
        });
    } catch (error) {
        return done(error);
    }
}));

// 🔹 Route Google Login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 🔹 Callback setelah login sukses
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const user = req.user;

    // Buat token JWT
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: 'user' }, "SECRET_KEY", { expiresIn: "1h" });

    res.redirect(`http://localhost:5500/index.html?token=${token}`);
});

module.exports = router;
