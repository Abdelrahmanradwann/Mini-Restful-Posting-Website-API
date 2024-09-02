const express = require('express');
const router = express.Router();
const userController = require('../controller/auth')
const { check } = require('express-validator');

router.post('/sign-up',
    [
        check('email').trim().toLowerCase().isEmail().withMessage('Please enter a valid email address'),
        check('userName').trim().not().isEmpty().withMessage('Please enter a user name'),
        check('password').trim().not().isEmpty().withMessage('Please enter a password'),
        check('password').isLength({ min: 5, max: 15 })
            .withMessage('Password must be at least 5 characters long'), 
        check('isPicExist').not().isEmpty().withMessage('Please determine whether you want to add PP or not'),
    ]
    , userController.signUp);

router.post('/log-in',
    [
        check('email').trim().toLowerCase().isEmail().withMessage('Please enter a valid email address'),
        check('password').trim().not().isEmpty().withMessage('Please enter a password'),
    ]
    , userController.logIn);



module.exports = router;