const express = require('express');
const router = express.Router();
const { validateToken } = require('../util/token');
const userController = require('../controller/user')
const { check } = require('express-validator');


router.post('/user', validateToken  ,
    check('userId').not().isEmpty().withMessage('Please enter a user id') ,
    userController.getUser)

router.patch('/user/profile', validateToken, userController.editProfile);

router.patch('/user/profile-pic', validateToken, userController.editProfilePic);

router.post('/friend/request', validateToken, 
    check('friendId').not().isEmpty().withMessage('Please enter a friend id'),
    userController.addFriend);


router.get('/friend/followers', validateToken, userController.getFollower);

router.get('/friend/followering', validateToken, userController.getFollowing);

router.get('/friend/requests/pending', validateToken, userController.getPending);

router.patch('/friend/request/accept', validateToken,
    check('userId').not().isEmpty().withMessage('Please enter a user id'),
    userController.acceptRequest);

router.delete('/friend/request/reject', validateToken,
    check('userId').not().isEmpty().withMessage('Please enter a user id'),
    userController.rejectRequest);

router.delete('/friend/unfollow', validateToken,
    check('userId').not().isEmpty().withMessage('Please enter a user id'),
    userController.unfollow);

router.delete('/friend/remove-following', validateToken,
    check('userId').not().isEmpty().withMessage('Please enter a user id'),
    userController.removeFollowing);

router.get('/search/:userName', validateToken,
    check('userName').not().isEmpty().withMessage('Please enter the user name'),
    userController.search)


router.get('/media/:objectName', validateToken, userController.getProfilePic)

module.exports = router;