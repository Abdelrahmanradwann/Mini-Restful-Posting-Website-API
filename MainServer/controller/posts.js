const { bufferStorage } = require('../util/storage');
const { Post } = require('../models/Post');
const { User } = require('../models/User');
const Busboy = require('busboy');


function validation(metadata) {
    const errors = [];
    if (!metadata.media) {
        errors.push('Please specifiy whether this post contains media or not');
    }
    if (!metadata.userId) {
        errors.push('Please specifiy the user id');
    }
    if (metadata.media != null && !metadata.media && (metadata.content == null)) {
        errors.push('Invalid post, media = 0 and not content');
    }
    return errors;
}

exports.createPost = (req, res) => {
    const busboy = Busboy({ headers: req.headers });
    const metadata = {};
    let isFile = false;
    const date = new Date();
    busboy.on('field', (fieldname, val) => {
        metadata[fieldname] = val;
    })
    
    busboy.on('file', async (fieldname, file, { mimeType }) => {
        const errors = validation(metadata);
        if (errors.length) {
            return errors;
        }
        isFile = true;
        const objectName = `${req.current.id}.${date}`;
        try {
            if (mimeType.startsWith('image/')) {
                await bufferStorage.putObject('photos', objectName, file, mimeType);
            }
            else if (mimeType.startsWith('video/')) {
                await bufferStorage.putObject('videos', objectName, file, mimeType);
            }
            else {
                return res.status(400).json({
                    message: 'Invalid file type'
                })
            }
        } catch (err) {
            console.error('Error uploading to MinIO:', err);
            return res.status(500).json({ message: 'Failed to upload media', error: err.message });
        }
    })

    busboy.on('finish', async () => {
        if (!isFile) {
            const errors = validation(metadata);
            if (errors.length) {
                return errors;
            }
            // checking it cuz mysql does not support FK in partitioning yet
            if (! await User.userExists({ id: metadata.userId })) {
                return res.status(404).json({
                    message: 'User not found'
                })
            }
            let post = new Post({
                content: metadata.content,
                media: metadata.media,
                userId: metadata.userId,
                createdAt: date,
                numComments: 0,
                numLikes: 0
            })
            post = await post.create();
            if (!post) {
                return res.status(500).json({
                    msg: 'Failed to create post'
                })
            }
            return res.status(201).json({
                msg: 'Post created successfully',
                post: post
            })
         
        }

        
        // produce

        
    })
    req.pipe(busboy)

}