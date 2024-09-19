const { createMasterConnection, createSlave1Connection, createSlave2Connection } = require('../util/db_helpers.js');
const { LikesOfPost } = require('./LikesOfPost.js');


class Post {
    constructor({ content = null, media, userId, createdAt, numComments = 0, numLikes = 0 }) {
        this.content = content
        this.media = media
        this.userId = userId
        this.createdAt = createdAt
        this.numComments = numComments
        this.numLikes = numLikes
    }

    async create() {
        let masterConnection = await createMasterConnection();
        try {
            const result = await masterConnection.query(
                `INSERT INTO Posts (content, media, userId, createdAt, numComments, numLikes)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [this.content, this.media, this.userId, this.createdAt, this.numComments, this.numLikes]
            );
            console.log('Post saved successfully:', result);
            return result;
        } catch (error) {
            console.log('Failed to save post: ', error);
            return false;
        }
    }

    static async getPosts(loggedInUser,page = 1, limit = 5) {
        let slave1Connection = await createSlave1Connection();

        let offset = (page - 1) * limit;
        const query = `
            SELECT p.userId, p.createdAt, p.content, p.media, p.numComments, p.numLikes
            FROM Posts p
            LEFT JOIN Friends f ON p.userId = f.friendId AND f.userId = ? AND f.status = 'accepted'
            WHERE (f.userId IS NOT NULL OR p.userId = ?)
            ORDER BY p.createdAt DESC
            LIMIT ?, ?;
        `;

        offset = parseInt(offset);
        limit = parseInt(limit);
        const params = [loggedInUser, loggedInUser, offset, limit];

        try {
            const [rows] = await slave1Connection.query(query, params);
            return rows
        } catch (error) {
            console.error('Error fetching posts:', error.message);
            throw error;
        }
    }
    static async likePost(postId,userId) {
        let masterConnection = await createMasterConnection();
    

        try {
            await masterConnection.beginTransaction();
            
            const didLikeBefore = await LikesOfPost.getLikes(postId, userId);
            if (didLikeBefore) {
               throw new Error('You already liked this post');
            }

            const [rows] = await masterConnection.query(
                `SELECT id FROM Posts WHERE id = ? LOCK IN SHARE MODE`,
                [postId]
            );

            if (rows.length === 0) {
                throw new Error('Post not found');
            }

            const result = await masterConnection.query(
                `UPDATE Posts SET numLikes = numLikes + 1 WHERE id = ?`,
                [postId]
            );



            await masterConnection.commit();

            return;
        } catch (err) {
            // Rollback the transaction in case of error
            await masterConnection.rollback();
            throw new Error('Error while adding like to a post: ' + err.message);
        }
    }

    static async removeLike(postId,userId) {
        let masterConnection = await createMasterConnection();

        try {
            await masterConnection.beginTransaction();

            const didLikeBefore = await LikesOfPost.getLikes(postId, userId);
            if (!didLikeBefore) {
                throw new Error('You already dont like this post');
            }   
            await LikesOfPost.removeLike_Post(postId, userId)
            const [rows] = await masterConnection.query(
                `SELECT id FROM Posts WHERE id = ? LOCK IN SHARE MODE`,
                [postId]
            );

            if (rows.length === 0) {
                throw new Error('Post not found');
            }

            await masterConnection.query(
                `UPDATE Posts SET numLikes = numLikes - 1 WHERE id = ?`,
                [postId]
            );

            await masterConnection.commit();

            return;
        } catch (err) {
            // Rollback the transaction in case of error
            await masterConnection.rollback();
            throw new Error(`Error while removing like from a post: ${err.message}`)
        }
    }


    static async addCommentCnt(postId) {
        let masterConnection = await createMasterConnection();

        const [rows] = await masterConnection.query(
            `SELECT id FROM Posts WHERE id = ? LOCK IN SHARE MODE`,
            [postId]
        );
        
        if (rows.length == 0) {
            throw new Error('Post not found');
        }
        await masterConnection.query(
            `UPDATE Posts SET numComments = numComments + 1 WHERE id = ?`,
            [postId]
        )
      
        return;
    }
    static async removeCommentCnt(postId) {
        let masterConnection = await createMasterConnection();

        const [rows] = await masterConnection.query(
            `SELECT id FROM Posts WHERE id = ? LOCK IN SHARE MODE`,
            [postId]
        );
        
        if (rows.length == 0) {
            throw new Error('Post not found');
        }
        await masterConnection.query(
            `UPDATE Posts SET numComments = numComments - 1 WHERE id = ?`,
            [postId]
        )

      
        return;
    }

    static async deletePost(postId, userId) {
        let masterConnection = await createMasterConnection();

        try {
            console.log(postId,userId)
            const [post] = await  masterConnection.query(`SELECT 1 FROM Posts WHERE id = ? AND userId = ? LIMIT 1`, [postId, userId]);
            console.log(post)
            if (post.length==0) {
                throw new Error('Post not found or you are not the author of this post');
            }

            await masterConnection.query(`DELETE FROM Posts WHERE id = ?`, [postId]);
            return;

        } catch (err) {
            throw err;
        }
    }

}
  

module.exports = {
    Post
}