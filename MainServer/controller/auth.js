const { User } = require('../models/User');
const { validationResult } = require('express-validator');
const argon2 = require('argon2');
const { genToken } = require('../util/token');
const { use } = require('../routes/auth');

exports.signUp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (await User.userExists(req.body.email)) {
        return res.status(409).json({ msg: 'This email already in use' });
    }

    const hashedPassword = await argon2.hash(req.body.password);
    
    if(req.isPicExist){}


    try {
        const user = new User({
            userName: req.body.userName,
            isPicExist: req.body.isPicExist,
            numFollowers: 0,
            numFollowing: 0,
            email: req.body.email,
            password: hashedPassword,
        });


        const savedUser = await user.save();
        genToken({ id:savedUser.id, email:savedUser.email });

        res.status(201).json({
            message: 'User registered successfully',
            user: savedUser
        });
    } catch (error) {
        console.error('Error during user registration:', error);
        
        res.status(500).json({
            message: 'Failed to register user',
            error: error.message 
        });
    }
}


exports.logIn = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.getUserByEmail(req.body.email);
    if (!user) {
        return res.status(404).json({ msg: 'Email is not correct' });
    }
        console.log(user.password)

    const passwordIsValid = await argon2.verify(user.password, req.body.password);
    if (!passwordIsValid) {
        return res.status(401).json({ msg: 'Password is not correct' });
    }
    const token = genToken({ id: user.id, email: user.email });
    res.status(200).json({
        message: 'User logged in successfully',
        token: token,
        user: user
    });
}

