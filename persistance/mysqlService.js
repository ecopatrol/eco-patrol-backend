const pool = require('./mysqlConnectionPool');
const bcrypt = require('bcrypt')

init = async () => {
    return new Promise((resolve, reject) => {
        let queryInitDatabase = [
        `CREATE TABLE IF NOT EXISTS users(
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(45),
            surname VARCHAR(45),
            email VARCHAR(45) UNIQUE NOT NULL,
            address VARCHAR(70),
            phone VARCHAR(20),
            username VARCHAR(15) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            avatar BLOB,
            points INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,
        `CREATE TABLE IF NOT EXISTS roles(
            id INT AUTO_INCREMENT PRIMARY KEY,
            role_name VARCHAR(45) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,
        `CREATE TABLE IF NOT EXISTS permissions(
            id INT AUTO_INCREMENT PRIMARY KEY,
            permission_name VARCHAR(255) NOT NULL UNIQUE,
            role_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles(id)
        );`,
        `CREATE TABLE IF NOT EXISTS users_roles(
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            role_id INT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (role_id) REFERENCES roles(id)
        );`,
        `CREATE TABLE IF NOT EXISTS reports(
            id INT AUTO_INCREMENT PRIMARY KEY,
            longitude REAL NOT NULL,
            latitude REAL NOT NULL,
            category INT,
            description TINYTEXT NOT NULL,
            picture BLOB,
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );`,
        `CREATE TABLE IF NOT EXISTS awards(
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TINYTEXT NOT NULL,
            points_required INT NOT NULL
        );`,
        `CREATE TABLE IF NOT EXISTS users_awards(
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            award_id INT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (award_id) REFERENCES awards(id)
        );`]
        
        let promises = []
        for(let i = 0; i < queryInitDatabase.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                pool.query(queryInitDatabase[i], (error, results, fields) => {
                    if(error)
                        reject(error);
                    else
                        resolve();
                });
            }));
        }
        Promise.all(promises).then(() => { resolve(); })
        .catch(error => reject(error))
    });
};

auth = async (requestBody) => {
    return new Promise((resolve, reject) => {
        let {username, password} = requestBody;
        if(username && password) {
            let query = `SELECT * FROM users WHERE username = '${username}';`;
            pool.query(query, (error, results, fields) => {
                if(error)
                    reject(error);
                else if(results.length == 1) {
                    if(bcrypt.compareSync(password, results[0].password)) {
                        resolve(results);
                    } else {
                        reject(new Error('Incorrect Password!'));                    }
                }
                else
                    reject(new Error('Incorrect Username and/or Password!'));
            });
        }
        else {
            reject(new Error('Please enter Username and Password!'));
        }
    });
};

register = async (requestBody) => {
    return new Promise((resolve, reject) => {
        let {username, email, password} = requestBody;
        if(username && email && password) {
            password = bcrypt.hashSync(password, 10)
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

updateUserData = async (username, requestBody) => {
    return new Promise((resolve, reject) => {
        if(username) {
            let queryUpdateUserData = `UPDATE users SET `;
            for(let attribute in requestBody) {
                if(attribute.toString().localeCompare('password') == 0) 
                    requestBody[attribute] = bcrypt.hashSync(requestBody[attribute], 10)
                queryUpdateUserData = queryUpdateUserData.concat(attribute + `='` + requestBody[attribute] + `',`);
            }
            queryUpdateUserData = queryUpdateUserData.slice(0, -1);
            queryUpdateUserData = queryUpdateUserData.concat(` WHERE username='${username}';`);
            
            pool.query(queryUpdateUserData, (error, results, fields) => {
                if(error)
                    reject(error);
                else {
                    resolve(results);
                }
            }); 
        }
        else
            reject(new Error('Error while updating users data!'))
    });
};

getReports = async () => {
    return new Promise((resolve, reject) => {
        let query = `SELECT * FROM reports;`
        
        pool.query(query, (error, results, fields) => {
            if(error)
                reject(error);
            else
                resolve(results);
        }); 
    });
};

postReport = async (requestBody) => {
    return new Promise((resolve, reject) => {
        let {username, longitude, latitude, category, description} = requestBody;
        if(username && longitude && latitude && category && description) {
            let queryGetUserId = `SELECT id FROM users WHERE username = '${username}';`;
            pool.query(queryGetUserId, (error, results, fields) => {
                if(error) {
                    resolve(error);
                }
                else {
                    let userId = results[0].id;
                    let queryCheckIfExists=`SELECT * FROM reports WHERE longitude=${longitude} and latitude=${latitude} and category=${category} and user_id=${userId};`;
                    pool.query(queryCheckIfExists, (error, results, fields) => {
                        if(error)
                            reject(error);
                        else
                            if (results.length == 0) {
                                let query = `
                                INSERT INTO reports (longitude, latitude, category, description, user_id) 
                                VALUES ('${longitude}', '${latitude}','${category}', '${description}','${userId}');`;
        
                                pool.query(query, (error, results, fields) => {
                                    if(error)
                                        reject(error);
                                    else
                                        resolve(results);
                                });
                            }
                            else {
                                reject(new Error('Report already exists!'))
                            }
                    });
                }
            }); 
        }
        else
            reject(new Error('Please fill up all fields!'))
    });
};

getUserAwards = async (request) => {
    return new Promise((resolve, reject) => {
        if(request.params.username) {
            let queryGetUserAwards = `SELECT A.name, A .description FROM awards as A JOIN users_awards JOIN users WHERE username='${request.params.username}';`;
            
            pool.query(queryGetUserAwards, (error, results, fields) => {
                if(error)
                    reject(error);
                else {
                    resolve(results);
                }
            }); 
        }
        else
            reject(new Error('Error!'))
    });
};

postUserAward = async (request) => {
    return new Promise((resolve, reject) => {
        if(request.params.username && request.params.awardname) {
            let queryGetUserPoints = `SELECT id, points FROM users WHERE username='${request.params.username}';`;
            
            pool.query(queryGetUserPoints, (error, results, fields) => {
                if(error)
                    reject(error);
                else {
                    let userPoints = results[0].points;
                    let userId = results[0].id;
                    let queryGetRequiredPoints = `SELECT id, points_required FROM awards WHERE name='${request.params.awardname}';`;
                    pool.query(queryGetRequiredPoints, (error, results, fields) => {
                        if(error)
                            reject(error);
                        else {
                            let pointsReguired = results[0].points_required;
                            let awardId = results[0].id;
                            if(results[0].points_required <= userPoints) {
                                let queryDecreasePoints = `UPDATE users SET points = points - ${pointsReguired} WHERE id='${userId}';`;
                                pool.query(queryDecreasePoints, (error, results, fields) => {
                                    if(error)
                                        reject(error);
                                    else {
                                        let queryAssignAward = `INSERT INTO users_awards(user_id, award_id) 
                                        VALUES ('${userId}', '${awardId}');`
                                        pool.query(queryAssignAward, (error, results, fields) => {
                                            if(error)
                                                reject(error);
                                            else 
                                                resolve(results);
                                        });
                                    }
                                });
                            }
                            else {
                                reject(new Error('You do not have enough points for the selected award'));
                            }
                        }
                    });
                }
            }); 
        }
        else
            reject(new Error('Error!'))
    });
};

module.exports = {
    init,
    auth,
    register,
    updateUserData,
    getReports,
    postReport,
    getUserAwards,
    postUserAward
}