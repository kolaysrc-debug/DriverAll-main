const express = require('express');
const router = express.Router();

// Home page endpoints
router.get('/', (req, res) => {
  res.json({ message: 'Home routes working' });
});

module.exports = router;
