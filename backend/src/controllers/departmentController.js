const Department = require('../models/Department');

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({ order: [['deptName', 'ASC']] });
    return res.json(departments);
  } catch (error) {
    console.error('getDepartments error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { deptName } = req.body;
    if (!deptName || deptName.trim() === '') {
      return res.status(400).json({ message: 'Department Name is required' });
    }

    const existing = await Department.findOne({ where: { deptName: deptName.trim() } });
    if (existing) {
      return res.status(400).json({ message: 'Department Name already exists' });
    }

    const dept = await Department.create({ deptName: deptName.trim() });
    return res.status(201).json(dept);
  } catch (error) {
    console.error('createDepartment error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    await dept.destroy();
    return res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('deleteDepartment error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
