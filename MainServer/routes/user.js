const express = require('express');
const router = express.Router();
const { validateToken } = require('../util/token');
const userController = require('../controller/user')


router.patch('/edit', validateToken, userController.editProfile);

router.patch('/edit-profilePic',validateToken,userController.editProfilePic)



module.exports = router;