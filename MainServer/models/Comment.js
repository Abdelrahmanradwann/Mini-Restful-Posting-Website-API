const { createMasterConnection, createSlave1Connection, createSlave2Connection } = require('../util/db_helpers.js');
const { Post } = require('./Post.js');
const { LikesOfComment } = require('./LikesOfComment.js');
const { use } = require('../routes/posts.js');

class Comment {
    constructor({ userId, postId, numLikes, text, createdAt }) {
        this.userId = userId;
        this.postId = postId;
        this.numLikes = numLikes;
        this.text = text;
        this.createdAt = createdAt;
    }

    async create() {
        let masterConnection = await createMasterConnection();
        try {
            await masterConnection.beginTransaction();

            const query = `INSERT INTO Comments (userId, postId, numLikes, text, createdAt) VALUES (?, ?, ?, ?, ?)`;
            const params = [this.userId, this.postId, this.numLikes, this.text, this.createdAt];
            const [result] = await masterConnection.query(query, params);
            await Post.addCommentCnt(this.postId);

            await masterConnection.commit()
            
            return result;
        } catch (err) {
            await masterConnection.rollback();
            throw new Error(`Failed to create a comment: ${err.message}` )
        }
    }

      static async removeComment(commentId, postId, userId) {
        let masterConnection = await createMasterConnection();

        try {
            await masterConnection.beginTransaction();
            let cnt = 0;
            const [comment] = await masterConnection.query(
                `SELECT 1 FROM Comments WHERE id = ? AND postId = ? AND userId LIMIT 1`,
                [commentId, postId,userId]
            );

            
            if (!comment.length) {
                cnt++;
            }

            if (cnt > 0) {
                const [post] = await masterConnection.query(`SELECT 1 FROM Posts WHERE id = ? AND userId = ?`, [postId, userId]);
                if (!post.length) {
                    cnt++;
                }
            }
            if (cnt == 2) {
                throw new Error('You are not the owner of the post or the comment');
            }
            await masterConnection.query(
                `DELETE FROM Comments WHERE id = ?`,
                [commentId]
            );

            await Post.removeCommentCnt(postId);

            await masterConnection.commit();


        } catch (err) {
            await masterConnection.rollback();
            throw new Error(`Failed to delete comment:  ${ err }`);
        }

    }

    static async likeComment(commentId, userId) {
        let masterConnection = await createMasterConnection();

        try {
            await masterConnection.beginTransaction();

            const is = await LikesOfComment.hasLikedComment(commentId, userId);
            if (is) {
                throw new Error('You has already liked this comment before');
            }
            await LikesOfComment.addLikeComment(commentId, userId);
            const query = `UPDATE Comments SET numLikes = numLikes + 1 WHERE id = ?`;
            const params = [commentId];
            const [result] = await masterConnection.query(query, params);

            await masterConnection.commit();

            return result;
        } catch (err) {
            await masterConnection.rollback();
            throw new Error(`Failed to like a comment: ${err.message}`);
        }

    }

    static async removeLikeComment(commentId, userId) {
        let masterConnection = await createMasterConnection();

        try {
            await masterConnection.beginTransaction();

            const is = await LikesOfComment.hasLikedComment(commentId, userId);
            if (!is) {
                throw new Error('You didnt like this comment in the first place');
            }
            await LikesOfComment.removeLikeComment(commentId, userId);
            const query = `UPDATE Comments SET numLikes = numLikes - 1 WHERE id = ?`;
            const params = [commentId];
            const [result] = await masterConnection.query(query, params);

            await masterConnection.commit();

            return result;
        } catch (err) {
            await masterConnection.rollback();
            throw new Error(`Failed to remove like from a comment: ${err.message}`);
        }
    }


    static async getComments(postId) {
        let connection = await createSlave1Connection();

        try {
            const [exists] = await connection.query(`SELECT 1 FROM Posts WHERE id = ? LIMIT 1`, [postId]);
            if (!exists.length) {
                throw new Error('Post not found')
            }
            const query = `SELECT id, userId, numLikes, text, createdAt FROM Comments WHERE postId = ?`;
            const params = [postId];
            const [rows] = await connection.query(query, params);
            return rows;
        } catch (err) {
            throw err;
        }
    }

}

module.exports = {
    Comment
}