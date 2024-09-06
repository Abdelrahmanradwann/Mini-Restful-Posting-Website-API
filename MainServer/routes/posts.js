const express = require('express');
const router = express.Router();
const postController = require('../controller/posts')
const { validateToken } = require('../util/token');


router.post('/upload',validateToken,postController.createPost)


module.exports = router;