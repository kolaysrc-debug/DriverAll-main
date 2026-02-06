const express = require('express');
const router = express.Router();

// User score endpoints
router.get('/', (req, res) => {
  res.json({ message: 'User score routes working' });
});

module.exports = router;
