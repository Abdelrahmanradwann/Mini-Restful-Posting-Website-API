const { UserMetaData } = require('../models/User')
const { User } = require('../models/User')
const { objectStore } = require('../util/storage_helper');
const Busboy = require('busboy')


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