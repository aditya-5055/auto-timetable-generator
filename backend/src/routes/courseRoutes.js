const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const auth = require('../middleware/auth');

router.get('/', auth, courseController.getCourses);
router.post('/', auth, courseController.createCourse);
router.delete('/:courseNumber', auth, courseController.deleteCourse);

module.exports = router;
