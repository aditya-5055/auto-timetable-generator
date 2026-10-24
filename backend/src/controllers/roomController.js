const Room = require('../models/Room');

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({ order: [['rNumber', 'ASC']] });
    return res.json(rooms);
  } catch (error) {
    console.error('getRooms error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { rNumber, seatingCapacity, roomType } = req.body;

    if (!rNumber || rNumber.trim() === '') {
      return res.status(400).json({ message: 'Room Number is required' });
    }
    if (!roomType || !['LECTURE', 'LAB'].includes(roomType)) {
      return res.status(400).json({ message: 'Room Type must be LECTURE or LAB' });
    }

    const capacity = parseInt(seatingCapacity, 10);
    if (isNaN(capacity) || capacity < 1) {
      return res.status(400).json({ message: 'Seating Capacity must be at least 1' });
    }

    // Check unique rNumber
    const existing = await Room.findOne({ where: { rNumber: rNumber.trim() } });
    if (existing) {
      return res.status(400).json({ message: 'Room Number already exists' });
    }

    const room = await Room.create({
      rNumber: rNumber.trim(),
      seatingCapacity: capacity,
      roomType
    });

    return res.status(201).json(room);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error('createRoom error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await room.destroy();
    return res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('deleteRoom error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
