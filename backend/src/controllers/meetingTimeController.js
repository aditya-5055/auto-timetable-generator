const MeetingTime = require('../models/MeetingTime');

exports.getMeetingTimes = async (req, res) => {
  try {
    const times = await MeetingTime.findAll({ order: [['day', 'ASC'], ['time', 'ASC']] });
    return res.json(times);
  } catch (error) {
    console.error('getMeetingTimes error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createMeetingTime = async (req, res) => {
  try {
    const { pid, time, day, slotType } = req.body;

    if (!pid || pid.trim() === '') {
      return res.status(400).json({ message: 'Meeting ID (pid) is required' });
    }
    if (pid.trim().length > 4) {
      return res.status(400).json({ message: 'Meeting ID cannot exceed 4 characters' });
    }
    if (!time || time.trim() === '') {
      return res.status(400).json({ message: 'Time slot string (e.g. 08:45 - 09:45) is required' });
    }
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    if (!day || !validDays.includes(day)) {
      return res.status(400).json({ message: 'Day must be Monday, Tuesday, Wednesday, Thursday, or Friday' });
    }
    if (!slotType || !['LECTURE', 'LAB'].includes(slotType)) {
      return res.status(400).json({ message: 'Slot Type must be LECTURE or LAB' });
    }

    // Check unique pid
    const existingPid = await MeetingTime.findByPk(pid.trim());
    if (existingPid) {
      return res.status(400).json({ message: 'Meeting ID (pid) already exists' });
    }

    // Check unique constraint [day, time, slot_type]
    const existingSlot = await MeetingTime.findOne({
      where: {
        day,
        time: time.trim(),
        slotType
      }
    });
    if (existingSlot) {
      return res.status(400).json({ message: 'A meeting slot at this time, day and type already exists' });
    }

    const meetingTime = await MeetingTime.create({
      pid: pid.trim(),
      time: time.trim(),
      day,
      slotType
    });

    return res.status(201).json(meetingTime);
  } catch (error) {
    console.error('createMeetingTime error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteMeetingTime = async (req, res) => {
  try {
    const { pid } = req.params;
    const mt = await MeetingTime.findByPk(pid);
    if (!mt) {
      return res.status(404).json({ message: 'Meeting Time not found' });
    }

    await mt.destroy();
    return res.json({ message: 'Meeting Time deleted successfully' });
  } catch (error) {
    console.error('deleteMeetingTime error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
