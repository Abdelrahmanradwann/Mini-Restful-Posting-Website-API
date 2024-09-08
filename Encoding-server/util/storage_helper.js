const Minio = require('minio');
// require('dotenv').config({path:'../.env'});


exports.objectStore = new Minio.Client({
    endPoint: 'minio-perm', 
    port: 9000, 
    useSSL: false,
    accessKey: 'user',
    secretKey: 'password'
});

exports.bufferStorage = new Minio.Client({
    endPoint: 'minio-tmp', 
    port: 9000, 
    useSSL: false,
    accessKey: 'user',
    secretKey: 'password'
});