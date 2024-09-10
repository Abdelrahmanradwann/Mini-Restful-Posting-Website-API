const { createMasterConnection, createSlave1Connection, createSlave2Connection } = require('../util/db_helpers.js');


class LikesOfPost {
    constructor(postId, userId) {
        this.postId = postId;
        this.userId = userId;
    }

    // check if usera has like the post or not and update
    static async getLikes(postId, userId) {
        let masterConnection = await createMasterConnection();
        try {
            const [rows] = await masterConnection.query(
                `SELECT 1 FROM LikesOfPost WHERE postId = ? AND userId = ? LIMIT 1`,
                [postId, userId]
            );
            if (rows.length > 0) {
                return true;
            } else {
                this.addLike_Post(postId, userId)
                return false;
            }
        } catch (error) {
            throw error;
        }
    }

    // add to the table if someone likes a post 
    static async addLike_Post(postId, userId) {
        let masterConnection = await createMasterConnection();
        await masterConnection.query(`INSERT INTO LikesOfPost (postId, userId) VALUES (?, ?)`, [postId, userId]);
        return
    }

    // remove from the table if someone pulled his like from the post
    static async removeLike_Post(postId, userId) {
        let masterConnection = await createMasterConnection();
        await masterConnection.query(`DELETE FROM LikesOfPost WHERE postId = ? AND  userId = ?`, [postId, userId]);
        return
    }


}
module.exports = {
    LikesOfPost
}