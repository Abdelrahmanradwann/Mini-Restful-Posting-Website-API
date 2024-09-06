const mysql = require('mysql2/promise'); 





let masterConnection = null;
let slave1Connection = null;
let slave2Connection = null;

const connectionIdleTimeout = 120000; // Timeout duration in milliseconds (e.g., 120 seconds)
let masterLastUsed = null;
let slave1LastUsed = null;
let slave2LastUsed = null;

async function createMasterConnection() {
    if (!masterConnection) {
        masterConnection = await mysql.createConnection({
            host: 'master',
            user: 'root',
            password: 'password',
            database: 'Mini-posting-website',
            port: 3306
        });
        masterLastUsed = Date.now(); // Update last used time
    } else {
        // Update last used time when the connection is reused
        masterLastUsed = Date.now();
    }
    return masterConnection;
}

async function createSlave1Connection() {
    if (!slave1Connection) {
        slave1Connection = await mysql.createConnection({
            host: 'slave1',
            user: 'root',
            password: 'password',
            database: 'Mini-posting-website',
            port: 3306
        });
        slave1LastUsed = Date.now();
    } else {
        slave1LastUsed = Date.now();
    }
    return slave1Connection;
}

async function createSlave2Connection() {
    if (!slave2Connection) {
        slave2Connection = await mysql.createConnection({
            host: 'slave2',
            user: 'root',
            password: 'password',
            database: 'Mini-posting-website',
            port: 3306
        });
        slave2LastUsed = Date.now();
    } else {
        slave2LastUsed = Date.now();
    }
    return slave2Connection;
}

// Function to close idle connections
function checkIdleConnections() {
    const now = Date.now();
    
    // Close master connection if idle
    if (masterConnection && (now - masterLastUsed) > connectionIdleTimeout) {
        masterConnection.end();
        masterConnection = null; // Clear reference
        console.log('Master connection closed due to inactivity');
    }
    
    // Close slave1 connection if idle
    if (slave1Connection && (now - slave1LastUsed) > connectionIdleTimeout) {
        slave1Connection.end();
        slave1Connection = null;
        console.log('Slave1 connection closed due to inactivity');
    }

    // Close slave2 connection if idle
    if (slave2Connection && (now - slave2LastUsed) > connectionIdleTimeout) {
        slave2Connection.end();
        slave2Connection = null;
        console.log('Slave2 connection closed due to inactivity');
    }
}

// Set up a timer to check for idle connections every minute
setInterval(checkIdleConnections, 60000); // Check every 60 seconds

// Export the connection functions
module.exports = {
    createMasterConnection,
    createSlave1Connection,
    createSlave2Connection
};

// Ensure connections are closed on application shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');

    if (masterConnection) {
        await masterConnection.end();
        console.log('Master connection closed');
    }

    if (slave1Connection) {
        await slave1Connection.end();
        console.log('Slave1 connection closed');
    }

    if (slave2Connection) {
        await slave2Connection.end();
        console.log('Slave2 connection closed');
    }

    process.exit(0);
});