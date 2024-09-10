const { createMasterConnection, createSlave1Connection, createSlave2Connection } = require('../util/db_helpers.js');


class LikesOfComment{
    constructor(commentId, userId) {
        this.commentId = commentId
        this.userId = userId;
    }

    // check if user has already liked the comment or not and update 
    static async hasLikedComment(commentId, userId) {
        const masterConnection = await createMasterConnection();
        try {
            const [rows] = await masterConnection.query(`SELECT 1 FROM LikesOfComment WHERE commentId = ? AND userId = ? LIMIT 1`, [commentId, userId]);
            if (rows.length > 0) {
                return true
            }
            else return false;
        } catch(err) {
            throw err;
        }
        
        
    }

    static async addLikeComment(commendId, userId) {
        const masterConnection = await createMasterConnection();

        try {
            await masterConnection.query(`INSERT INTO LikesOfComment VALUES (?,?)`, [commendId, userId]);
            return

        } catch (err) {
            throw err;
        }
    }

     static async removeLikeComment(commendId, userId) {
        const masterConnection = await createMasterConnection();

        try {
            console.log('hereee')
            await masterConnection.query(`DELETE FROM LikesOfComment WHERE commentId = ? AND userId = ?`, [commendId, userId]);
            return

        } catch (err) {
            throw err;
        }
    }
}

module.exports = {
    LikesOfComment
}