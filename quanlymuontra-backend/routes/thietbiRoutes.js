const express = require('express');
const router = express.Router();
const thietbiController = require('../controllers/thietbiController');

router.get('/', thietbiController.getAllThietBi);
router.post('/', thietbiController.createThietBi); 
router.put('/:maTB', thietbiController.updateThietBi);
router.delete('/:maTB', thietbiController.deleteThietBi);

module.exports = router;