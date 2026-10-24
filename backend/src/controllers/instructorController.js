const Instructor = require('../models/Instructor');

exports.getInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.findAll({ order: [['name', 'ASC']] });
    return res.json(instructors);
  } catch (error) {
    console.error('getInstructors error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createInstructor = async (req, res) => {
  try {
    const { uid, name, maxLecturesPerWeek, maxLabsPerWeek } = req.body;

    if (!uid || uid.trim() === '') {
      return res.status(400).json({ message: 'Teacher ID (uid) is required' });
    }
    if (uid.trim().length > 6) {
      return res.status(400).json({ message: 'Teacher ID cannot exceed 6 characters' });
    }
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Teacher Name is required' });
    }

    const lectures = parseInt(maxLecturesPerWeek, 10);
    if (isNaN(lectures) || lectures < 0 || lectures > 30) {
      return res.status(400).json({ message: 'Max Lectures Per Week must be between 0 and 30' });
    }

    const labs = parseInt(maxLabsPerWeek, 10);
    if (isNaN(labs) || labs < 0 || labs > 20) {
      return res.status(400).json({ message: 'Max Labs Per Week must be between 0 and 20' });
    }

    // Check unique uid
    const existing = await Instructor.findOne({ where: { uid: uid.trim() } });
    if (existing) {
      return res.status(400).json({ message: 'Teacher ID (uid) already exists' });
    }

    const instructor = await Instructor.create({
      uid: uid.trim(),
      name: name.trim(),
      maxLecturesPerWeek: lectures,
      maxLabsPerWeek: labs
    });

    return res.status(201).json(instructor);
  } catch (error) {
    console.error('createInstructor error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const instructor = await Instructor.findByPk(id);
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    await instructor.destroy();
    return res.json({ message: 'Instructor deleted successfully' });
  } catch (error) {
    console.error('deleteInstructor error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
