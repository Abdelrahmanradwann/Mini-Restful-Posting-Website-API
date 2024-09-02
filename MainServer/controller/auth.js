const { User } = require('../models/User');

exports.signUp = async (req, res, next) => {
    try {
        const user = new User({
            userName: req.body.userName,
            isPicExist: req.body.isPicExist,
            numFollowers: req.body.numFollowers,
            numFollowing: req.body.numFollowing,
            email: req.body.email,
            password: req.body.password,
            bio: req.body.bio,
        });


        const savedUser = await user.save();
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
