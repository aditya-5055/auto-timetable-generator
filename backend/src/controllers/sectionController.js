const Section = require('../models/Section');
const Department = require('../models/Department');
const Division = require('../models/Division');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const MeetingTime = require('../models/MeetingTime');
const Room = require('../models/Room');
const Instructor = require('../models/Instructor');

exports.getSections = async (req, res) => {
  try {
    const sections = await Section.findAll({
      include: [
        { model: Department, as: 'department' },
        { model: Division, as: 'division' },
        { model: Batch, as: 'batch' },
        { model: Course, as: 'course' },
        { model: MeetingTime, as: 'meetingTime' },
        { model: Room, as: 'room' },
        { model: Instructor, as: 'instructor' }
      ],
      order: [['sectionId', 'ASC']]
    });
    return res.json(sections);
  } catch (error) {
    console.error('getSections error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createSection = async (req, res) => {
  try {
    const {
      sectionId,
      departmentId,
      numClassInWeek,
      divisionId,
      batchId,
      courseNumber,
      isElective,
      electiveGroup
    } = req.body;

    if (!sectionId || sectionId.trim() === '') {
      return res.status(400).json({ message: 'Section ID is required' });
    }
    if (!departmentId) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    if (!courseNumber) {
      return res.status(400).json({ message: 'Course is required' });
    }

    const classesPerWeek = parseInt(numClassInWeek, 10);
    if (isNaN(classesPerWeek) || classesPerWeek < 1 || classesPerWeek > 10) {
      return res.status(400).json({ message: 'Classes Per Week must be between 1 and 10' });
    }

    // Verify Department
    const dept = await Department.findByPk(departmentId);
    if (!dept) {
      return res.status(400).json({ message: 'Department not found' });
    }

    // Verify Course
    const course = await Course.findByPk(courseNumber);
    if (!course) {
      return res.status(400).json({ message: 'Course not found' });
    }

    // Verify Division (optional)
    if (divisionId) {
      const division = await Division.findByPk(divisionId);
      if (!division) {
        return res.status(400).json({ message: 'Division not found' });
      }
    }

    // Verify Batch (optional)
    if (batchId) {
      const batch = await Batch.findByPk(batchId);
      if (!batch) {
        return res.status(400).json({ message: 'Batch not found' });
      }
    }

    // Verify Elective Group matches choice if provided
    if (electiveGroup && !['G1', 'G2'].includes(electiveGroup)) {
      return res.status(400).json({ message: 'Elective Group must be G1 or G2' });
    }

    // Check unique sectionId
    const existing = await Section.findByPk(sectionId.trim());
    if (existing) {
      return res.status(400).json({ message: 'Section ID already exists' });
    }

    const section = await Section.create({
      sectionId: sectionId.trim(),
      departmentId,
      numClassInWeek: classesPerWeek,
      divisionId: divisionId || null,
      batchId: batchId || null,
      courseNumber,
      isElective: !!isElective,
      electiveGroup: electiveGroup || null
    });

    const result = await Section.findByPk(section.sectionId, {
      include: [
        { model: Department, as: 'department' },
        { model: Division, as: 'division' },
        { model: Batch, as: 'batch' },
        { model: Course, as: 'course' }
      ]
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('createSection error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const section = await Section.findByPk(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    await section.destroy();
    return res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('deleteSection error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
