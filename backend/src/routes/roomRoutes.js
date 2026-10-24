const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth');

router.get('/', auth, roomController.getRooms);
router.post('/', auth, roomController.createRoom);
router.delete('/:id', auth, roomController.deleteRoom);

module.exports = router;
