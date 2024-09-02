const mysql = require('mysql2/promise'); 




let masterConnection = null;
let slave1Connection = null;
let slave2Connection = null;



async function createMasterConnection() {
    if (!masterConnection) {
        masterConnection = await mysql.createConnection({
            host: 'master', // Use service name here
            user: 'root',
            password: 'password',
            database: 'Mini-posting-website',
            port: 3306
        });
    }
    return masterConnection;
}


async function createSlave1Connection() {
    if (!slave1Connection) {
        slave1Connection = await mysql.createConnection({
            host: 'slave1', // Use service name here
            user: 'root',
            password: 'password',
            database: 'Mini-posting-website',
            port: 3306
        });
    }
    return slave1Connection;
}

async function createSlave2Connection() {
    if (!slave2Connection) {
        slave2Connection = await mysql.createConnection({
            host: 'slave2', // Use service name here
            user: 'root',
            password: 'password',
            database: 'Mini-posting-website',
            port: 3306
        });
    }
    return slave2Connection;
}


module.exports = {
    createMasterConnection,
    createSlave1Connection,
    createSlave2Connection
};

// // Create a connection to the master database
// const createMasterConnection = async () => {
//     return await mysql.createConnection({
//         host: 'master', // Use service name here
//         user: 'root',
//         password: 'password',
//         database: 'Mini-posting-website',
//         port: 3306
//     });
// };

// // Create a connection to the slave database
// const createSlave1Connection = async () => {
//     return await mysql.createConnection({
//         host: 'slave1', // Use service name here for slave1
//         user: 'root',
//         password: 'password',
//         database: 'Mini-posting-website',
//         port: 3306 
//     });
// };

// const createSlave2Connection = async () => {
//     return await mysql.createConnection({
//         host: 'slave2', // Use service name here for slave1
//         user: 'root',
//         password: 'password',
//         database: 'Mini-posting-website',
//         port: 3306
//     });
// };

// // Export a function to create the connections
// module.exports = {
//     createMasterConnection,
//     createSlave1Connection,
//     createSlave2Connection
// };
