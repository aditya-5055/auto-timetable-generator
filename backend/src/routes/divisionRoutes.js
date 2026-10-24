const express = require('express');
const router = express.Router();
const divisionController = require('../controllers/divisionController');
const auth = require('../middleware/auth');

router.get('/', auth, divisionController.getDivisions);
router.post('/', auth, divisionController.createDivision);
router.delete('/:id', auth, divisionController.deleteDivision);

module.exports = router;
