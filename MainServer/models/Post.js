const { createMasterConnection, createSlave1Connection, createSlave2Connection } = require('../util/db_helpers.js');


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
    

}

module.exports = {
    Post
}