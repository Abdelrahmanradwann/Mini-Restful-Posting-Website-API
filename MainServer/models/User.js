const { createMasterConnection, createSlave1Connection, createSlave2Connection } = require('../util/db_helpers.js');




 class UserMetaData {
     constructor( email, password, verificationCode = null, timeOfCode = null, confirmation = null) {
        this.email = email;
        this.password = password;
        this.verificationCode = verificationCode;
        this.timeOfCode = timeOfCode;
        this.confirmation = confirmation;
    }

     async save() {
         let masterConnection = await createMasterConnection();


        try {
            const result = await masterConnection.query(
                `INSERT INTO UserMetaData (email, password, verificationCode, timeOfCode, confirmation)
                 VALUES (?, ?, ?, ?, ?)`,
                [this.email, this.password, this.verificationCode, this.timeOfCode, this.confirmation]
            );
            console.log('UserMetaData saved successfully:', result);
            return result;
        } catch (error) {
            console.error('Error saving user meta data:', error.message);
            return false;
        }
    }
}

class User extends UserMetaData {
    constructor({ userName, isPicExist, numFollowers, numFollowing,
        email, password, verificationCode = null, timeOfCode = null, confirmation = null, friendsNo = 0, bio = null }) {
        super(email, password, verificationCode, timeOfCode, confirmation);
        this.userName = userName;
        this.isPicExist = isPicExist;
        this.numFollowers = numFollowers;
        this.numFollowing = numFollowing;
        this.friendsNo = friendsNo;
        this.bio = bio;
    }

    async save() {
        let masterConnection = await createMasterConnection();

        try {
            const result = await masterConnection.query(
                `INSERT INTO Users (userName, isPicExist, friendsNo, bio, numFollowers, numFollowing)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [this.userName, this.isPicExist, this.friendsNo, this.bio, this.numFollowers, this.numFollowing]
            );

            console.log('User saved successfully:', result);

            const metaDataSaveResult = await super.save();
            if (!metaDataSaveResult) {
                throw new Error('Failed to save UserMetaData');
            }
            return result;
        } catch (error) {
            console.error('Error saving user:', error.message);
            return false;
        }
    }
     
    static async userExists(email) {
        let slave1Connection = await createSlave1Connection();
        let query = '';
        let params = [];

        console.log(email)
        // Check if the email exists in the UserMetaData table
        if (email) {
            query = 'SELECT 1 FROM UserMetaData WHERE email = ? LIMIT 1';
            params = [email];
        } else {
            throw new Error('No valid parameter provided to check user existence');
        }

        try {
            const [rows] = await slave1Connection.query(query, params);
            return rows.length > 0;
        } catch (error) {
            console.error('Error checking user existence:', error.message);
            return false;
        }
    }
    static async getUserByEmail(email) {
        let slave2Connection = await createSlave2Connection();
        try {
            const [rows] = await slave2Connection.query(
                `SELECT Users.*, UserMetaData.password 
                FROM Users 
                JOIN UserMetaData ON Users.id = UserMetaData.id 
                WHERE UserMetaData.email = ? 
                LIMIT 1`,
                [email]
            );

            if (rows.length > 0) {
                return rows[0];
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching user by email:', error.message);
            throw error;
        }
    }
}




module.exports = {
    User,
    UserMetaData
}