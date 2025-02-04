const db = require('../models/db');

// Get all destinations
const getAllWisata = (req, res) => {
  const query = 'SELECT * FROM wisata';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching data' });
    } else {
      res.status(200).json(results);
    }
  });
};

// Get destination by ID
const getWisataById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM wisata WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching data' });
    } else if (results.length === 0) {
      res.status(404).json({ message: 'Wisata not found' });
    } else {
      res.status(200).json(results[0]);
    }
  });
};

module.exports = { getAllWisata, getWisataById };
