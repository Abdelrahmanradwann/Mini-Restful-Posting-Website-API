const express = require('express');
const router = express.Router();
const userController = require('../controller/auth')

router.post('/sign-up', userController.signUp);

module.exports = router;