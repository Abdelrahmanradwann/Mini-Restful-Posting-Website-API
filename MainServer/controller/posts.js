const { bufferStorage } = require('../util/storage_helper');
const { Post } = require('../models/Post');
const { User } = require('../models/User');
const { Comment } = require('../models/Comment')
const { producer } = require('../util/kafka_helper');
const Busboy = require('busboy');
const { objectStore } = require('../util/storage_helper.js')
const { validationResult } = require('express-validator');



const limit = 5;
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
    
    console.log(req.current.id)
    busboy.on('file', async (fieldname, file, { filename,mimeType }) => {
        const errors = validation(metadata);
        if (errors.length) {
            return res.status(400).json({ error: errors });
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
                 msg:'Post added to the minio'
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
                media: 0,
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

exports.getPosts = async (req, res) => {
    console.log('User id is ' + req.current.id);
    const { page } = req.query;
    const limit = 5;  // You can adjust this as needed
    const pageNum = page || 1;
    
    try {
        const rows = await Post.getPosts(req.current.id,pageNum, limit);

        // Attach a media URL for each post if media exists
        const postsWithMediaUrls = rows.map((post) => {
            if (post.media == 1) {
                const createdAtDate = new Date(post.createdAt);
                const createdAt = createdAtDate.toISOString().slice(0, 19).replace('T', '_') // Replace space with underscore and colon with dash
                const objectName = `${post.userId}.${createdAt}.png`; 
                
                post.mediaUrl = `/media/photos/${objectName}`;
            }
            else if (post.media == 2) {
                const createdAtDate = new Date(post.createdAt);
                const createdAt = createdAtDate.toISOString().slice(0, 19).replace('T', '_')
                const objectName = `${post.userId}.${createdAt}.webm`; 

                post.mediaUrl = `/media/videos/${objectName}`;

            }
            return post;
        });

        res.status(200).json(postsWithMediaUrls); // Return the posts with media URLs
    } catch (error) {
        console.error('Error fetching posts:', error.message);
        res.status(500).send(error.message);
    }
};



exports.getMedia = async (req, res) => {
    let { bucket, objectName } = req.params;  // folder can be 'photos' or 'videos'
    objectName = objectName.replace(/_/g, ' ');

    
    try {
        const statObject = await objectStore.statObject(bucket, objectName);
        const fileSize = statObject.size;
        let ext = 'png';
        let folder = 'image';
        if (bucket == 'videos') {
            ext = 'webm';
            folder = 'video';
        }
 
        const ContentType = `${folder}/${ext}`; 

        res.writeHead(200, {     // not needed but prefered
            'Content-Length': fileSize,
            'Content-Type': ContentType,
        });

        // Stream the media
        objectStore.getObject(bucket, objectName, (err, stream) => {
            if (err) {
                return res.status(404).send("Media not found");
            }
            stream.pipe(res); // Pipe the media stream to the response in chunks
            stream.on('end', () => {
                console.log("Media has been successfully sent.");
            });
        });
   

    } catch (err) {
        res.status(500).send("Error retrieving media: " + err.message);
    }
}


exports.addLike = (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }
    const { postId } = req.body;
    Post.likePost(postId,req.current.id).then(result => {
        res.status(200).json({
            msg: 'Like added successfully',
            result: result
        })
    }).catch(err => {
        res.status(500).json({
            msg: 'Failed to add like',
            error: err.message
        })
    });
}

exports.removeLike = (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }
    const { postId } = req.body;
    Post.removeLike(postId,req.current.id).then(result => {
        res.status(200).json({
            msg: 'Like removed successfully',
            result: result
        })
    }).catch(err => {
        res.status(500).json({
            msg: 'Failed to remove like',
            error: err.message
        })
    });
}

exports.addComment = (req, res) => {
  
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }
    const { postId, text } = req.body;

    let comment = new Comment({
        userId: req.current.id,
        postId: postId,
        numComments: 0,
        numLikes: 0,
        text: text,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    comment.create().then(result => {
        res.status(200).json({
            msg: 'Comment added successfully',
            result: result
        })
    }).catch(err => {
        res.status(500).json({
            msg: 'Failed to add comment',
            error: err.message
        })
    })

}


exports.deleteComment = (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }
    const { commentId, postId } = req.body;
    Comment.removeComment(commentId,postId, req.current.id).then(result => {
        res.status(200).json({
            msg: 'Comment removed successfully',
            result: result
        })
    }).catch(err => {
        res.status(500).json({
            msg: 'Failed to remove comment',
            error: err.message
        })
    })

}


exports.addLikeComment = (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }
    const { commentId } = req.body;
    Comment.likeComment(commentId, req.current.id).then(result => {
        res.status(200).json({
            msg: 'Like added successfully',
            result: result
        })
    }).catch(err => {
          res.status(500).json({
            msg: 'Failed to like comment',
            error: err.message
        })
    })

}


exports.removeLikeComment = (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }
    const { commentId } = req.body;
    Comment.removeLikeComment(commentId, req.current.id).then(result => {
        res.status(200).json({
            msg: 'Like removed successfully',
            result: result
        })
    }).catch(err => {
        return res.status(500).send(err.message);
    })  
}

exports.deletePost = (req, res) => {
    if (!validationResult(req).isEmpty()) {
        return res.status(400).send(validationResult(req));
    }
    const { postId } = req.body;
    Post.deletePost(postId,req.current.id).then(result => {
        res.status(200).json({
            msg: 'Post deleted successfully'
        })
    }).catch(err => {
        return res.status(500).json({ error: err.message });
    })
}


exports.editPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors);
    }
    const { postId, text } = req.body;
    try {
        await Post.editPost(postId, text, req.current.id);
        return res.status(200).json({ msg: 'Post updated successfully' });
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }

}

