const { createMasterConnection, createSlave1Connection, createSlave2Connection } = require('../util/db_helpers.js');



const stat = {
    a: 'accepted',
    r: 'rejected',
    p: 'pending'
};



class Friend {
    constructor(userId, friendId, status) {
        this.userId = userId;
        this.friendId = friendId;
        this.status = status;
    }

    static async getFollowers(userId) {
        const connection = await createSlave1Connection();
        try {
            const query = 'SELECT userId FROM Friends WHERE friendId = ? AND status = ?';
            const [rows] = await connection.query(query, [userId, 'accepted']);
            return rows;
        } catch (err) {
            throw err;
        }
    }


    static async getFollowing(userId) {
        const connection = await createSlave2Connection();
        try {
            const query = 'SELECT friendId FROM Friends WHERE userId = ? AND status = ?';
            const [rows] = await connection.query(query, [userId, 'accepted']);
            return rows;
        } catch (err) {
            throw err;
        }
    }

    static async requestSent(userId, friendId) {
        const connection = await createSlave1Connection();
        try {
            const query = 'SELECT 1 FROM Friends WHERE userId = ? AND friendId = ? Limit 1';
            const [rows] = await connection.query(query, [userId, friendId]);
            return rows;
        } catch (err) {
            throw err;
        }
    }

    static async addFriend(userId, friendId, status = stat.p ) {
        const connection = await createMasterConnection();
        try {
            const query = 'INSERT INTO Friends (userId, friendId, status) VALUES (?, ?, ?)';
            const [rows] = await connection.query(query, [userId, friendId, status]);
            return rows;
        } catch (err) {
            throw err;
        }
    }
}


module.exports = {
    Friend
}