const Course = require('../models/Course');
const Instructor = require('../models/Instructor');

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [{ model: Instructor, as: 'instructors', through: { attributes: [] } }],
      order: [['courseNumber', 'ASC']]
    });
    return res.json(courses);
  } catch (error) {
    console.error('getCourses error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { courseNumber, courseName, maxNumbStudents, courseType, instructors, isElective } = req.body;

    if (!courseNumber || courseNumber.trim() === '') {
      return res.status(400).json({ message: 'Course Code (courseNumber) is required' });
    }
    if (courseNumber.trim().length > 8) {
      return res.status(400).json({ message: 'Course Code cannot exceed 8 characters' });
    }
    if (!courseName || courseName.trim() === '') {
      return res.status(400).json({ message: 'Course Name is required' });
    }
    if (!courseType || !['LECTURE', 'LAB'].includes(courseType)) {
      return res.status(400).json({ message: 'Course Type must be LECTURE or LAB' });
    }

    const students = parseInt(maxNumbStudents, 10);
    if (isNaN(students) || students < 1) {
      return res.status(400).json({ message: 'Max Students must be at least 1' });
    }

    // Check unique courseNumber
    const existing = await Course.findByPk(courseNumber.trim());
    if (existing) {
      return res.status(400).json({ message: 'Course Code already exists' });
    }

    // Create course
    const course = await Course.create({
      courseNumber: courseNumber.trim(),
      courseName: courseName.trim(),
      maxNumbStudents: students,
      courseType,
      isElective: !!isElective
    });

    // Handle Many-to-Many instructors
    if (instructors && Array.isArray(instructors) && instructors.length > 0) {
      // Verify instructor ids exist
      const validInstructors = await Instructor.findAll({ where: { id: instructors } });
      const validIds = validInstructors.map(i => i.id);
      await course.setInstructors(validIds);
    }

    const result = await Course.findByPk(course.courseNumber, {
      include: [{ model: Instructor, as: 'instructors', through: { attributes: [] } }]
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('createCourse error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { courseNumber } = req.params;
    const course = await Course.findByPk(courseNumber);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await course.destroy();
    return res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('deleteCourse error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
