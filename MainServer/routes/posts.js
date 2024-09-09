const express = require('express');
const router = express.Router();
const postController = require('../controller/posts')
const { validateToken } = require('../util/token');


router.post('/upload',validateToken,postController.createPost)

router.get('/posts', validateToken, postController.getPosts)

router.get('/media/:bucket/:objectName', validateToken, postController.getMedia)

module.exports = router;