const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');
const auth = require('../middleware/auth');

router.get('/', auth, instructorController.getInstructors);
router.post('/', auth, instructorController.createInstructor);
router.delete('/:id', auth, instructorController.deleteInstructor);

module.exports = router;
