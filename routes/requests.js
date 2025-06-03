const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    message: 'Requests endpoint - Coming soon'
  });
});

module.exports = router; 