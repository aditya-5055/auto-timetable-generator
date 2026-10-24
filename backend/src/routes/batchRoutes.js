const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const auth = require('../middleware/auth');

router.get('/', auth, batchController.getBatches);
router.post('/', auth, batchController.createBatch);
router.delete('/:id', auth, batchController.deleteBatch);

module.exports = router;
