const pool = require('./mysqlConnectionPool');

init = async () => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT table_name FROM information_schema.tables;', (error, results, fields) => {
            if(error)
                reject(error);
            resolve(results);
        });
    });
};

login = async (username, password) => {
    return new Promise((resolve, reject) => {
        let query = `SELECT * FROM users WHERE username = '${username}' and password = '${password}';`
        pool.query(query, (error, results, fields) => {
            if(error)
                reject(error);
            if(results.length == 1)
                resolve(results);
            else
                reject(new Error('Caller is not authorized'));
        });
    });
};

register = async (username, email, password) => {
    return new Promise((resolve, reject) => {
        let query = `
        INSERT INTO users (username, email, password) 
        VALUES ('${username}', '${email}','${password}');`
        
        pool.query(query, (error, results, fields) => {
            if(error)
                reject(error);
            else
                resolve(results);
        });
    });
};

module.exports = {
    init,
    login,
    register
}