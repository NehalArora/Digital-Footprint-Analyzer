const express = require('express');
const router = express.Router();
const { startScan, getScanResult, getScanHistory } = require('../controllers/scanController');

router.post('/start', startScan);
router.get('/result/:sessionId', getScanResult);
router.get('/history/:email', getScanHistory);
module.exports = router;