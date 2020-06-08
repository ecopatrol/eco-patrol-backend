/**
 * MySQL connection pool
 * @author mm170395
 */

var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'db',
    user: 'root',
    password: 'admin',
    database: 'ecopatroldb',
    insecureAuth : true
});

module.exports = pool;