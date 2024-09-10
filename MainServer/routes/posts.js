const express = require('express');
const router = express.Router();
const postController = require('../controller/posts')
const { validateToken } = require('../util/token');
const { check } = require('express-validator');


router.post('/upload',validateToken,postController.createPost)

router.get('/posts', validateToken, postController.getPosts)

router.get('/media/:bucket/:objectName', validateToken, postController.getMedia)

router.patch('/like', validateToken
    ,
    [
        check('postId').not().isEmpty().withMessage('Please enter a post id'),
    ]
    ,
    postController.addLike)

router.delete('/like', validateToken
    ,
    [
        check('postId').not().isEmpty().withMessage('Please enter a post id'),
    ]
    ,
    postController.removeLike)


router.patch('/comment', validateToken
    ,
    [
        check('postId').not().isEmpty().withMessage('Please enter a post id'),
        check('text').not().isEmpty().withMessage('Please enter a comment'),
    ]
    ,
    postController.addComment)


router.delete('/comment', validateToken,
    [
        check('postId').not().isEmpty().withMessage('Please enter a post id'),
        check('commentId').not().isEmpty().withMessage('Please enter a comment id')
    ],
    postController.deleteComment)

router.patch('/like-comment', validateToken,
    [
        check('commentId').not().isEmpty().withMessage('Please enter a comment id'),   
    ],
    postController.addLikeComment
)

module.exports = router;