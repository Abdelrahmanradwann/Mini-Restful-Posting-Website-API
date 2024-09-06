const { User } = require('../models/User');
const { validationResult } = require('express-validator');
const argon2 = require('argon2');
const { genToken } = require('../util/token');
const { objectStore } = require('../util/storage_helper');
const validator = require('validator');

const Busboy = require('busboy');



function validation({ metadata }) {
        let errors = [];
    if (!metadata.email) {
        errors.push('Please enter a valid email address');
    }
    if (metadata.userName.length < 1 || metadata.userName.length > 30) {
        errors.push('Username must be between 3 to 30 characters');
    }
    if (!validator.isEmail(metadata.email)) {
        errors.push('Please enter a valid email address');
    }
    if (!metadata.password || metadata.password.length < 5 || metadata.password.length > 35) {
        errors.push('Password must be between 5 to 35 characters');
    }
    if (typeof metadata.isPicExist === 'undefined') {
        errors.push('Please specify whether a profile picture will be uploaded or not');
    }
    return errors;
}

exports.signUp = async (req, res, next) => {
    const busboy = Busboy({ headers: req.headers });
    let metadata = {};
    let isFile = false;

    busboy.on('field',  (fieldname, val) => {
            metadata[fieldname] = val;
    });


    busboy.on('file', async (fieldname, file, { filename, encoding, mimeType }) => {
        isFile = true;

        const errors = validation({metadata});
        if (errors.length) {
            return res.status(400).json({ errors: errors });
        }

        // console.log(metadata.email)
        if (await User.userExists({ email: metadata.email })) {
            return res.status(409).json({ msg: 'This email already in use' });
        }
        const objectName = `${metadata.email}.${Date.now()}.${fieldname.split('.').pop()}`   

        try {
            if (mimeType.startsWith('image/')) {
                objectStore.putObject('photos', objectName, file, mimeType, (err, etag) => {
                    if (err) {
                        // if bucket does not exist or policies related to the bucket and so on
                         console.log('Error uploading to MinIO:', err);
                         return res.status(500).json({ message: 'Failed to upload picture', error: err.message })
                     }
                 });
            }
            else return res.status(400).json({ msg: 'File should be an image' });
        } catch (error) {
            // catches any broader error like server or network exceptions
            console.error('Error uploading to MinIO :', error);
            return res.status(500).json({ message: 'Failed to upload picture', error: error.message });
        }
    });

    busboy.on('finish', async () => {
        try {
            if (!isFile) {
                const errors = validation({ metadata });
                if (errors.length) {
                    return res.status(400).json({ errors: errors });
                }
            if (await User.userExists(metadata.email)) {
                 return res.status(409).json({ msg: 'This email already in use' });
              }
            }
            const hashedPassword = await argon2.hash(metadata.password);
            const user = new User({
                userName: metadata.userName,
                isPicExist: metadata.isPicExist,
                friendsNo: 0,
                bio: null,
                numFollowers: 0,
                numFollowing: 0,
                email: metadata.email,
                password: hashedPassword,
            });

            const savedUser = await user.save();
            const token = genToken({ id: savedUser[0].insertId });

            res.status(201).json({
                message: 'User registered successfully',
                user: await User.getUserByEmail(metadata.email),
                token: token
            });
        } catch (error) {

            console.error('Error during user registration:', error);

            objectStore.removeObject('photos', `${metadata.email}.${Date.now()}`, function (err){
                 if (err) {
                    return console.log('Error removing object:', err);
                    }
                 console.log('Object removed successfully.');
            });

            res.status(500).json({
                message: 'Failed to register user',
                error: error.message
            });
        }
    });

    req.pipe(busboy); // Start processing the request
};


exports.logIn = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.getUserByEmail(req.body.email);
    if (!user) {
        return res.status(404).json({ msg: 'Email is not correct' });
    }

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

