const express = require('express');
const router = express.Router();

// Scoring endpoints
router.get('/', (req, res) => {
  res.json({ message: 'Scoring routes working' });
});

module.exports = router;
