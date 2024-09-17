const { createMasterConnection, createSlave1Connection, createSlave2Connection } = require('../util/db_helpers.js');




class UserMetaData {
    constructor(email, password, verificationCode = null, timeOfCode = null, confirmation = null) {
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
     
    async update(fieldsToUpdate, conditions) {
        let masterConnection = await createMasterConnection();

        try {
            // Create dynamic SQL query based on the fields to update
            const setClause = Object.keys(fieldsToUpdate)
                .map(field => `${field} = ?`)
                .join(', ');

            const values = Object.values(fieldsToUpdate);
            
            const whereClause = Object.keys(conditions)
                .map(condition => `${condition} = ?`)
                .join(' AND ');

            const whereValues = Object.values(conditions);

            const query = `UPDATE UserMetaData SET ${setClause} WHERE ${whereClause}`;

            const result = await masterConnection.query(query, [...values, ...whereValues]);

            return result;

        } catch (err) {
            throw new Error('Error while updating user data: ' + err.message);
        }
    }

    async verification(email) {
        let masterConnection = await createMasterConnection();

        try {
            const result = await masterConnection.query(
                `SELECT verificationCode, timeOfCode FROM UserMetaData WHERE email = ? LIMIT 1`,
                [email]
            );
            console.log('UserMetaData: ', result);
            return result[0][0];
        } catch (err) {
            throw new Error(err);
        }
    }

    static async getEmailById(id) {
        let masterConnection = await createMasterConnection();

        try {
            const result = await masterConnection.query(
                `SELECT email FROM UserMetaData WHERE id = ? LIMIT 1`,
                [id]
            );
            console.log('UserMetaData: ', result);
            return result[0][0].email;
        }

        catch (err) {
            throw err;
        }
    }
}


class User extends UserMetaData {
    constructor({ userName, isPicExist, numFollowers, numFollowing,
        email, password, verificationCode = null, timeOfCode = null, confirmation = null, bio = null }) {
        super(email, password, verificationCode, timeOfCode, confirmation);
        this.userName = userName;
        this.isPicExist = isPicExist;
        this.numFollowers = numFollowers;
        this.numFollowing = numFollowing;
        this.bio = bio;
    }

    async save() {
        let masterConnection = await createMasterConnection();

        await masterConnection.beginTransaction();
        try {
            const result = await masterConnection.query(
                `INSERT INTO Users (userName, isPicExist, bio, numFollowers, numFollowing)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [this.userName, this.isPicExist, this.bio, this.numFollowers, this.numFollowing]
            );

            console.log('User saved successfully:', result);

            const metaDataSaveResult = await super.save();
            if (!metaDataSaveResult) {
                throw new Error('Failed to save UserMetaData');
            }
            await masterConnection.commit()
            return result;
        } catch (error) {
            await masterConnection.rollback();
            console.error('Error saving user or user metadata. Transaction rolled back:', error.message);
            return false;
        }
    }
     
    static async userExists({ email = null, id = null }) {
        let slave1Connection = await createSlave1Connection();
        let query = '';
        let params = [];

        // Check if the email exists in the UserMetaDat a table
        if (email) {
            query = 'SELECT 1 FROM UserMetaData WHERE email = ? LIMIT 1';
            params = [email];
        }
        else if (id) {
            query = 'SELECT 1 FROM UserMetaData WHERE id = ? LIMIT 1';
            params = [id];
        }
        else {
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
        let masterConnection = await createMasterConnection(); // needs to be master connection cuz it is async replication
        try {                                                  // and when signing up it won't find it in the slaves
      
            const [rows] = await masterConnection.query(
                `SELECT Users.id, Users.*, UserMetaData.password
                FROM Users 
                JOIN UserMetaData ON Users.id = UserMetaData.id 
                WHERE UserMetaData.email = ? 
                LIMIT 1`,
                [email]
            );
            console.log(rows)
            if (rows.length > 0) {
                return {user: new User(rows[0]), id:rows[0].id}
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching user by email:', error.message);
            throw error;
        }
    }

    static async updateInSub(fieldsToUpdate, conditions) {
        let masterConnection = await createMasterConnection();

        try {
            // Create dynamic SQL query based on the fields to update
            const setClause = Object.keys(fieldsToUpdate)
                .map(field => `${field} = ?`)
                .join(', ');

            const values = Object.values(fieldsToUpdate);
            
            const whereClause = Object.keys(conditions)
                .map(condition => `${condition} = ?`)
                .join(' AND ');

            const whereValues = Object.values(conditions);

            const query = `UPDATE Users SET ${setClause} WHERE ${whereClause}`;

            const result = await masterConnection.query(query, [...values, ...whereValues]);

            return result;

        } catch (err) {
            throw new Error('Error while updating user: ' + err.message);
        }
    }


    static async getUserById(id) {
        let masterConnection = await createMasterConnection();
        try {                                                  
      
            const [rows] = await masterConnection.query(
                `SELECT Users.id, Users.*
                FROM Users
                WHERE Users.id = ?
                LIMIT 1`,
                [id]
            );
            if (rows.length > 0) {
                return rows[0]
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