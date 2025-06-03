const express = require('express');
const router = express.Router();

const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    status: 'success',
    message: 'Admin endpoint - Coming soon'
  });
});

module.exports = router; 