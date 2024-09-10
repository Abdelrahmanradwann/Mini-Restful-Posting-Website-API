const { createMasterConnection, createSlave1Connection, createSlave2Connection } = require('../util/db_helpers.js');
const { Post } = require('./Post.js');
const { LikesOfComment } = require('./LikesOfComment.js');

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

      static async removeComment(commentId,postId) {
        let masterConnection = await createMasterConnection();

        try {
            await masterConnection.beginTransaction();

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
    

}

module.exports = {
    Comment
}