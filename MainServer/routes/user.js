const express = require('express');
const router = express.Router();
const { validateToken } = require('../util/token');
const userController = require('../controller/user')
const { check } = require('express-validator');


router.post('/user', validateToken
    ,
    check('userId').not().isEmpty().withMessage('Please enter a user id')
    ,
    userController.getUser)

router.patch('/edit', validateToken, userController.editProfile);

router.patch('/edit-profilePic',validateToken,userController.editProfilePic)

router.post('/add-friend', validateToken
    ,
        check('friendId').not().isEmpty().withMessage('Please enter a friend id')
    ,
    userController.addFriend)

router.get('/pending', validateToken, userController.getPending)

router.patch('/accept', validateToken,
    check('userId').not().isEmpty().withMessage('Please enter a user id')
    ,
    userController.acceptRequest
)

router.delete('/reject', validateToken,
    check('userId').not().isEmpty().withMessage('Please enter a user id')
    ,
    userController.rejectRequest
)


router.delete('/unfollow', validateToken,
    check('userId').not().isEmpty().withMessage('Please enter a user id')
    ,
    userController.unfollow

)


module.exports = router;