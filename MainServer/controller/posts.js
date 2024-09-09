const { bufferStorage } = require('../util/storage_helper');
const { Post } = require('../models/Post');
const { User } = require('../models/User');
const { producer } = require('../util/kafka_helper');
const Busboy = require('busboy');


function validation(metadata) {
    const errors = [];
    if (!metadata.media) {
        errors.push('Please specifiy whether this post contains media or not');
    }
    if (metadata.media != null && metadata.media==0 && metadata.content.length==0) {
        errors.push('Invalid post, no media and no content');
    }
    return errors;
}

exports.createPost = (req, res) => {
    const busboy = Busboy({ headers: req.headers });
    console.log("here")
    const metadata = {};
    let isFile = false;
    let date = new Date();
    date = date.toISOString().slice(0, 19).replace('T', ' '); 
    busboy.on('field', (fieldname, val) => {
        metadata[fieldname] = val;
    })
    
    busboy.on('file', async (fieldname, file, { filename,mimeType }) => {
        const errors = validation(metadata);
        if (errors.length) {
            return errors;
        }
        isFile = true;
        const objectName = `${req.current.id}.${date}.${filename.split('.').pop()}`; // taking the extension
        try {
            let bucket;
            if (mimeType.startsWith('image/')) {
                bucket = 'photos';
            } else if (mimeType.startsWith('video/')) {
                bucket = 'videos';
            } else {
                return res.status(400).json({ message: 'Invalid file type' });
            }
            const topic = bucket=='photos'?'Photos':'Videos';
            await bufferStorage.putObject(bucket, objectName, file, mimeType, async (err, etag) => {
                if (err) {
                    console.log('Error uploading to MinIO: ', err);
                    return res.status(500).json({ message: 'Failed to upload media', error: err.message });
                }
                await producer.connect();
                console.log("hereeee")
                await producer.send({
                    topic: topic,

                    messages: [
                        {
                            value: JSON.stringify({
                                objectName: objectName,
                                userId: req.current.id,
                                createdAt: date,
                                media: mimeType.startsWith('image/') ? 'photo' : 'video',
                                content: metadata.content})
                        }
                    ]
                })
            });
            
            return res.status(201).json({
                message: 'Media uploaded successfully',
                objectName: objectName,
                userId: req.current.id,
                createdAt: date,
                media: mimeType.startsWith('image/') ? 'photo' : 'video',
                content: metadata.content
            })
        
    
        } catch (err) {
            console.error('Error uploading to MinIO:', err);
            return res.status(500).json({ message: 'Failed to upload media', error: err.message });
        }


    })

    busboy.on('finish', async () => {
        if (!isFile) {
            console.log(metadata)
            const errors = validation(metadata);
            if (errors.length) {
                return res.status(400).json({ errors: errors });
            }
            // checking it cuz mysql does not support FK in partitioning yet
            if (! await User.userExists({ id: req.current.id })) {
                return res.status(404).json({
                    message: 'User not found'
                })
            }
            let post = new Post({
                content: metadata.content,
                media: metadata.media,
                userId: req.current.id,
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
    })
    req.pipe(busboy)

}