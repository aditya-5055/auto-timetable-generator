const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const auth = require('../middleware/auth');

router.get('/', auth, sectionController.getSections);
router.post('/', auth, sectionController.createSection);
router.delete('/:sectionId', auth, sectionController.deleteSection);

module.exports = router;
