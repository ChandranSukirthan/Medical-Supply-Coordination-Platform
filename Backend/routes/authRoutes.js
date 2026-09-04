const express = require('express');
const router = express.Router();
const { registerFacility, loginFacility } = require('../controllers/authController');

router.post('/register', registerFacility);
router.post('/login', loginFacility);

module.exports = router;
