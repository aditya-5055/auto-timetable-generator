const Division = require('../models/Division');
const Department = require('../models/Department');

exports.getDivisions = async (req, res) => {
  try {
    const divisions = await Division.findAll({
      include: [{ model: Department, as: 'department' }],
      order: [['divisionName', 'ASC']]
    });
    return res.json(divisions);
  } catch (error) {
    console.error('getDivisions error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createDivision = async (req, res) => {
  try {
    const { divisionName, departmentId, totalStudents, electiveGroup } = req.body;

    if (!divisionName || divisionName.trim() === '') {
      return res.status(400).json({ message: 'Division Name is required' });
    }
    if (!departmentId) {
      return res.status(400).json({ message: 'Department ID is required' });
    }

    const students = parseInt(totalStudents, 10);
    if (isNaN(students) || students < 1) {
      return res.status(400).json({ message: 'Total Students must be at least 1' });
    }

    // Check if department exists
    const dept = await Department.findByPk(departmentId);
    if (!dept) {
      return res.status(400).json({ message: 'Department not found' });
    }

    // Check unique constraint [division_name, department_id]
    const existing = await Division.findOne({
      where: {
        divisionName: divisionName.trim(),
        departmentId
      }
    });
    if (existing) {
      return res.status(400).json({ message: 'Division with this name already exists in the department' });
    }

    const division = await Division.create({
      divisionName: divisionName.trim(),
      departmentId,
      totalStudents: students,
      electiveGroup: electiveGroup ? electiveGroup.trim() : null
    });

    return res.status(201).json(division);
  } catch (error) {
    console.error('createDivision error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteDivision = async (req, res) => {
  try {
    const { id } = req.params;
    const division = await Division.findByPk(id);
    if (!division) {
      return res.status(404).json({ message: 'Division not found' });
    }

    await division.destroy();
    return res.json({ message: 'Division deleted successfully' });
  } catch (error) {
    console.error('deleteDivision error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
