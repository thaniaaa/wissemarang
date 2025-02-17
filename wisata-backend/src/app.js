const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const wisataRoutes = require('./routes/wisataRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); // Gunakan express.json() untuk parsing JSON request

// Definisikan Routes
app.use('/api/wisata', wisataRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use("/api/profile", publicRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/rating', ratingRoutes);

// Pastikan folder 'uploads' tersedia dan bisa diakses
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/wisataImage', express.static(path.join(__dirname, '../wisataImage')));


module.exports = app;
