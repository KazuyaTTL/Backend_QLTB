const express = require('express');
const router = express.Router();
const phieumuonController = require('../controllers/phieumuonController');

router.post('/', phieumuonController.createPhieuMuon);

module.exports = router;