const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const wisataRoutes = require('./routes/wisataRoutes');
const reviewsRoutes = require('./routes/reviewsRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(bodyParser.json());
app.use(cors());

// 🟢 Pastikan semua route didaftarkan di sini
app.use('/api/wisata', wisataRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;
