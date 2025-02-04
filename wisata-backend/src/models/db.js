const mysql = require('mysql');

// Konfigurasi koneksi ke MySQL
const db = mysql.createConnection({
  host: 'localhost', // Ganti dengan alamat host database
  user: 'root', // Username MySQL
  password: '', // Password MySQL
  database: 'wisata_semarang' // Nama database
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

module.exports = db;
