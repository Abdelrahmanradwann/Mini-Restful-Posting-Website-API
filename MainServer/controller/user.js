const { User } = require('../models/User')
const { objectStore } = require('../util/storage_helper');
const Busboy = require('busboy')
const { validationResult } = require('express-validator'); 
const { Friend } = require('../models/Friend');
const e = require('express');



exports.getUser = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }
    const { userId } = req.body;
    User.getUserById( userId ).then(i => {
        return res.status(200).json({ user: i });
    }).catch(i => {
        return res.status(400).json({ error: i });
    })
}

exports.editProfile = async (req, res) => {
    const { userName, bio } = req.body;
    if ( !userName ||  !bio) {
        return res.status(400).json({ msg: 'Please send all required fields' });
    }
    try {
        const result = await User.updateInSub({userName:userName,bio:bio},{id:req.current.id})
        console.log(result)
        return res.status(200).json({ msg: 'Profile updated successfully'})
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
}


exports.editProfilePic = async (req, res) => {
    const busboy = Busboy({ headers: req.headers });
    let metaData = {};
    let isFile = false;

    busboy.on('field', (fieldname, value) => {
        metaData[fieldname] = value;
    });

    busboy.on("file", async (fieldname, file, { filename, encoding, mimeType }) => {
        isFile = true;
        
        const email = metaData.email;
        if (!email) {
            return res.status(400).json({ msg: 'Please provide the email' });
        }
        const fileName = `${email}.png`;

        try {
            objectStore.removeObject('photos', fileName);
            console.log('File removed:', fileName);
        } catch (error) {
            console.error('Error removing file:', error);
            return res.status(500).json({ error: 'Error removing file' });
        }

        try {
            objectStore.putObject('photos', fileName, file, mimeType, (err, etag) => {
                if (err) {
                    console.log('Error uploading to MinIO:', err);
                    return res.status(500).json({ message: 'Failed to upload picture', error: err.message })
                }
                console.log('file added successfully');
            });
        } catch (error) {
            console.error('Error uploading to MinIO :', error);
            return res.status(500).json({ message: 'Failed to upload picture', error: error.message });
        }

        try {
            await User.updateInSub({ isPicExist: true }, { id: req.current.id });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }

    });
    busboy.on('finish', async () => {
        if (!isFile) {
            const email = metaData.email;
            if (!email) {
                return res.status(400).json({ msg: 'Please provide the email' });
            }
            const fileName = `${email}.png`;
            try {
                objectStore.removeObject('photos', fileName);
                console.log('File removed:', fileName);
            } catch (error) {
                console.error('Error removing file:', error);
                return res.status(500).json({ error: 'Error removing file' });
            }

            try {
                await User.updateInSub({ isPicExist: false }, { id: req.current.id });
            } catch (err) {
                return res.status(500).json({ error: err.message });
            }
        }
        res.status(200).json({ message: 'Process finished successfully' });
    });

    req.pipe(busboy);
};


exports.addFriend = async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }
    const { friendId } = req.body;
    if (!await User.userExists({ id: friendId })) {
        return res.status(404).json({ msg: 'User not found' })
    }

    if (friendId == req.current.id) {
        return res.status(400).json({ msg: 'cannot add friend req to yourself' });
    }

    const wasSent = await Friend.requestSent(req.current.id, friendId);
    if (wasSent.length > 0) {
        return res.status(400).json({ msg: 'Friend request has already been sent.' });
    }
    try {
        await Friend.addFriend(req.current.id, friendId);
        return res.status(200).json({ msg: 'Friend added successfully' });
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }

}


exports.getPending = (req, res) => {
    Friend.getPendingRequests(req.current.id).then(result => {
        res.status(200).json(result);
    }).catch(err => {
        res.status(500).json({ msg: err.message });
    });
}

exports.acceptRequest = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }
    const { userId } = req.body;
    if (!await User.userExists({ id: userId })) {
        return res.status(404).json({ msg: 'User not found' })
    }

    Friend.acceptFriend(userId, req.current.id).then(result => {
        return res.status(200).json({ msg: `Request was accepted` });
    }).catch(err => { 
        return res.status(500).json({ err: err.message });
    })
        
}

exports.rejectRequest = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }
    const { userId } = req.body;
    if (!await User.userExists({ id: userId })) {
        return res.status(404).json({ msg: 'User not found' })
    }

    Friend.rejectFriend(userId, req.current.id).then(result => {
        return res.status(200).json({ msg: `Request was rejected` });
    }).catch(err => {
        return res.status(500).json({ err: err.message });
    })
}


exports.unfollow = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }
    const { userId } = req.body;
    if (!await User.userExists({ id: userId })) {
        return res.status(404).json({ msg: 'User not found' })
    }

    Friend.unfollow(req.current.id, userId).then(result => {
        return res.status(200).json({ msg: `Unfollowed successfully` });
    }).catch(err => {
        return res.status(500).json({ err: err.message });
    })
}