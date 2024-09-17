const express = require('express');
const router = express.Router();
const { validateToken } = require('../util/token');
const userController = require('../controller/user')
const { check } = require('express-validator');


router.patch('/edit', validateToken, userController.editProfile);

router.patch('/edit-profilePic',validateToken,userController.editProfilePic)

router.post('/add-friend', validateToken
    ,
        check('friendId').not().isEmpty().withMessage('Please enter a friend id')
    ,
    userController.addFriend)

module.exports = router;