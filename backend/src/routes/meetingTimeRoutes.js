const express = require('express');
const router = express.Router();
const meetingTimeController = require('../controllers/meetingTimeController');
const auth = require('../middleware/auth');

router.get('/', auth, meetingTimeController.getMeetingTimes);
router.post('/', auth, meetingTimeController.createMeetingTime);
router.delete('/:pid', auth, meetingTimeController.deleteMeetingTime);

module.exports = router;
