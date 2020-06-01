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
            role_name VARCHAR(45) UNIQUE NOT NULL,
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
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (role_id) REFERENCES roles(id)
        );`,
        `CREATE TABLE IF NOT EXISTS reports(
            id INT AUTO_INCREMENT PRIMARY KEY,
            longitude REAL NOT NULL,
            latitude REAL NOT NULL,
            category VARCHAR(255),
            description TINYTEXT NOT NULL,
            picture BLOB,
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (award_id) REFERENCES awards(id)
        );`,
        ` INSERT INTO roles (role_name) VALUES ('administrator');`,
        ` INSERT INTO roles (role_name) VALUES ('operator');`,
        ` INSERT INTO roles (role_name) VALUES ('user');`,
        ` INSERT INTO permissions (permission_name, role_id) VALUES ('USERS:CREATE,READ,DELETE', 1);`,
        ` INSERT INTO permissions (permission_name, role_id) VALUES ('READ,DELETE', 2);`,
        ` INSERT INTO permissions (permission_name, role_id) VALUES ('READ', 3);`,
        ` INSERT INTO users (username, email, password) VALUES ('admin', 'admin@email.com', 'admin');`,
        ` INSERT INTO users_roles (user_id, role_id) SELECT users.id, roles.id FROM roles, users WHERE roles.role_name='administrator' and users.username='admin';`
    ]
        
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
                        let queryRole = `SELECT role_name as role FROM users INNER JOIN users_roles ON users.id=users_roles.user_id INNER JOIN roles on role_id=roles.id  WHERE username='${username}';`;
                        pool.query(queryRole, (error, results, fields) => {
                            if(error)
                                reject(error);
                            else
                                resolve(results);
                        });
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
                else {
                    let querySetUserRole = `INSERT INTO users_roles (user_id, role_id) SELECT users.id, roles.id FROM users, roles WHERE users.username='${username}' and roles.role_name='user';`
            
                    pool.query(querySetUserRole, (error, results, fields) => {
                        if(error)
                            reject(error);
                        else {
                            resolve(results);
                        }
                    }); 
                }
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

makeUserOperator = async (request) => {
    return new Promise((resolve, reject) => {
        let username = request.params.username;
        if(username) {
            let queryDeletePreviousUserRole = `DELETE FROM users_roles WHERE user_id IN (SELECT id FROM users WHERE username='${username}');`

            
            pool.query(queryDeletePreviousUserRole, (error, results, fields) => {
                if(error)
                    reject(error);
                else {
                    let queryMakeUserOperator = `INSERT INTO users_roles (user_id, role_id) SELECT users.id, roles.id FROM users, roles WHERE users.username='${username}' and roles.role_name='operator';`
                     pool.query(queryMakeUserOperator, (error, results, fields) => {
                        if(error)
                            reject(error);
                        else 
                            resolve(results)
                    });
                }
            }); 
        }
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

getUsers = async () => {
    return new Promise((resolve, reject) => {
        let query = `SELECT username, email FROM users;`
        
        pool.query(query, (error, results, fields) => {
            if(error)
                reject(error);
            else
                resolve(results);
        }); 
    });
};

getUserData = async (request) => {
    return new Promise((resolve, reject) => {
        if(request.params.username) {
            let query = `SELECT name, surname, email, address, phone, username, points, avatar FROM users where username='${request.params.username}';`
            
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

deleteUser = async (request) => {
    return new Promise((resolve, reject) => {
        if(request.params.username) {
            let query = `DELETE FROM users where username='${request.params.username}';`
            
            pool.query(query, (error, results, fields) => {
                if(error)
                    reject(error);
                else
                    resolve(results);
            });
        }
        else 
            reject(new Error('Username is missing.'))
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
                    let queryCheckIfExists=`SELECT * FROM reports WHERE longitude=${longitude} and latitude=${latitude} and category='${category}' and user_id=${userId};`;
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

deleteReport = async (request) => {
    return new Promise((resolve, reject) => {
        let {longitude, latitude, category} = request.body;
        if(longitude && latitude && category) {
            let queryDeleteReport = `DELETE FROM reports WHERE longitude=${longitude} and latitude='${latitude}' and category='${category}';`;
            
            pool.query(queryDeleteReport, (error, results, fields) => {
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

getReportStatistics = async (request) => {
    return new Promise((resolve, reject) => {
        let queryGetReportsStatistics = `SELECT category, COUNT(category) as count FROM reports GROUP BY category;`;
        
        pool.query(queryGetReportsStatistics, (error, results, fields) => {
            if(error)
                reject(error);
            else {
                resolve(results);
            }
        });
    });
};

module.exports = {
    init,
    auth,
    register,
    updateUserData,
    getUserData,
    makeUserOperator,
    getReports,
    postReport,
    getUserAwards,
    postUserAward,
    deleteReport,
    deleteUser,
    getUsers,
    getReportStatistics
}