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

auth = async (username, password) => {
    return new Promise((resolve, reject) => {
        if(username && password) {
            let query = `SELECT * FROM users WHERE username = '${username}' and password = '${password}';`
            pool.query(query, (error, results, fields) => {
                if(error)
                    reject(error);
                else if(results.length == 1)
                    resolve(results);
                else
                    reject(new Error('Incorrect Username and/or Password!'));
            });
        }
        else {
            reject(new Error('Please enter Username and Password!'));
        }
    });
};

register = async (username, email, password) => {
    return new Promise((resolve, reject) => {
        if(username && email && password) {
            let query = `
            INSERT INTO users (username, email, password) 
            VALUES ('${username}', '${email}','${password}');`
            
            pool.query(query, (error, results, fields) => {
                if(error)
                    reject(error);
                else
                    resolve(results);
            }); 
        }
        else
            reject(new Error('Please fill up all fields!'))
    });
};

module.exports = {
    init,
    auth,
    register
}