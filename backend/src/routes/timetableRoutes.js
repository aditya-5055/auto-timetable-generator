const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const auth = require('../middleware/auth');

router.post('/generate', auth, timetableController.generateTimetable);
router.get('/', auth, timetableController.getTimetable);

module.exports = router;
