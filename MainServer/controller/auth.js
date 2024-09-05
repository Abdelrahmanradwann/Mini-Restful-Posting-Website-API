const { User } = require('../models/User');
const { validationResult } = require('express-validator');
const argon2 = require('argon2');
const { genToken } = require('../util/token');
const { objectStore } = require('../util/storage');

const Busboy = require('busboy');



function validation({ metadata }) {
        let errors = [];
        if (!metadata.email) {
            errors.push('Please enter a valid email address');
    
        }
        if (!metadata.userName) {
            errors.push('User name must be given');
        }
        if (!metadata.password) {
            errors.push('Password must be between 5 to 35 characters');
        }
            
        if (!metadata.isPicExist) {
            errors.push('Determine whether you will upload profike pic or not');
    }
    return errors;
}

exports.signUp = async (req, res, next) => {
    const busboy = Busboy({ headers: req.headers });
    let metadata = {};
    const fieldPromises = [];
    let file = false;

    busboy.on('field',  (fieldname, val) => {
    fieldPromises.push(new Promise((resolve) => {  // uses promises as the events themselves are async
        metadata[fieldname] = val;
        resolve();
        }));
    });


    busboy.on('file', async (fieldname, file, { filename, encoding, mimeType }) => {
        await Promise.all(fieldPromises);
        file = true;
        req.body = metadata;

        const errors = validation({metadata});
        if (errors.length) {
            return res.status(400).json({ errors: errors });
        }

   
        if (await User.userExists(metadata.email)) {
            return res.status(409).json({ msg: 'This email already in use' });
        }
        
        const objectName = metadata.email   // todo: edit the name

        try {
            // todo: ensure they are extensions of images
            await objectStore.putObject('photos', objectName, file, mimeType);
        } catch (error) {
            console.error('Error uploading to MinIO:', error);
            return res.status(500).json({ message: 'Failed to upload picture', error: error.message });
        }
    });

    busboy.on('finish', async () => {
        try {
            if (!file) {
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

