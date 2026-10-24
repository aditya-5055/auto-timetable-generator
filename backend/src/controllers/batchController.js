const Batch = require('../models/Batch');
const Division = require('../models/Division');

exports.getBatches = async (req, res) => {
  try {
    const batches = await Batch.findAll({
      include: [{ model: Division, as: 'division' }],
      order: [['batchName', 'ASC']]
    });
    return res.json(batches);
  } catch (error) {
    console.error('getBatches error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createBatch = async (req, res) => {
  try {
    const { batchName, divisionId, studentCount } = req.body;

    if (!batchName || batchName.trim() === '') {
      return res.status(400).json({ message: 'Batch Name is required' });
    }
    if (!divisionId) {
      return res.status(400).json({ message: 'Division ID is required' });
    }

    const count = parseInt(studentCount, 10);
    if (isNaN(count) || count < 1) {
      return res.status(400).json({ message: 'Student Count must be at least 1' });
    }

    // Check if division exists
    const division = await Division.findByPk(divisionId);
    if (!division) {
      return res.status(400).json({ message: 'Division not found' });
    }

    // Check unique constraint [division_id, batch_name]
    const existing = await Batch.findOne({
      where: {
        divisionId,
        batchName: batchName.trim()
      }
    });
    if (existing) {
      return res.status(400).json({ message: 'Batch with this name already exists in this division' });
    }

    const batch = await Batch.create({
      batchName: batchName.trim(),
      divisionId,
      studentCount: count
    });

    return res.status(201).json(batch);
  } catch (error) {
    console.error('createBatch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findByPk(id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    await batch.destroy();
    return res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('deleteBatch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
