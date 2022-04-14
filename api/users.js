var mysql = require('mysql');
let bcrypt = require("bcrypt");

var connection = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database
})

exports.login = async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    connection.query("SELECT * FROM users WHERE email = ?", username, (err, rows, _) => {
        if (err) throw err

        if (rows.length === 1) {
            //compare bcrypt from PHP generated hash
            bcrypt.compare(password, rows[0]['PasswordHash'].replace("$2y$", "$2a$")).then((hashRes) => {
                if (hashRes) {
                    req.session.loggedIn = true;
                    req.session.username = username;
                    req.session.ID = rows[0]['ID'];
                    req.session.Access = rows[0]['Access'];
                    (req.session.Access > 10) ? req.session.isAdmin = true: req.session.isAdmin = false
                    res.status(200).json({
                        "data": {
                            "id": req.session.ID,
                            "username": req.session.username
                        }
                    });
                } else //password does not match
                {
                    res.status(401).json({
                        "error": {
                            "code": 401,
                            "message": "Invalid credentials!"
                        }
                    });
                }
            });

        }
    });
}

exports.info = async (req, res) => {
    //return username and id if in valid session
    if (req.session.loggedIn) {
        res.status(200).json({
            "username": req.session.username,
            "ID": req.session.ID
        });
    } else {
        res.status(401).json({
            "error": {
                "code": 401,
                "message": "Please log in!"
            }
        });
    }
}

exports.newUser = async (req, res) => {
    //if logged in, already have account
    if (req.session.loggedIn) {
        res.status(403).json({
            "error": {
                "code": 403,
                "message": "You are logged in already!"
            }
        });
    } else {
        let email = req.body.username;
        let password = req.body.password;
        //check to see if no other user exist with that email
        connection.query("SELECT * FROM users WHERE email = ?", email, (err, rows, _) => {
            if (rows.length > 0) {
                res.status(409).json({
                    "error": {
                        "code": 409,
                        "message": "An account with that email already exists!"
                    }
                });
            } else {
                //hash password and insert information into database
                bcrypt.hash(password, 10, (errHash, hash) => {
                    if (errHash) throw errHash;
                    connection.query("INSERT INTO users (email, PasswordHash, Access) VALUES (?, ?, ?)", [email, hash, 0], (errInsert, result) => {
                        if (errInsert) throw errInsert;
                        res.status(201).json({
                            "data": {}
                        });
                    });
                });
            }
        });
    }
}

exports.logout = async (req, res) => {
    //destroy session
    if (req.session.loggedIn) {
        req.session.destroy();
        res.status(200).json({
            "data": {}
        });
    } else
        res.status(401).json({
            "error": {
                "code": 401,
                "message": "User is not signed in!"
            }
        });
}

exports.changePassword = async (req, res) => {
    if (req.session.loggedIn) {
        let email = req.session.username;
        let currentPassword = req.body.currentPassword;
        let newPassword = req.body.newPassword;
        //get current password hash
        connection.query("SELECT * FROM users WHERE email = ?", email, (err, rows, _) => {
            if (err) throw err;
            //compare currentpassword hash with supplied current password
            bcrypt.compare(currentPassword, rows[0]['PasswordHash'].replace("$2y$", "$2a$")).then((hashResult) => {
                if (hashResult) {
                    //generate new hash from new password
                    bcrypt.hash(newPassword, 10, (errHash, newHash) => {
                        //insert hash into database
                        connection.query("UPDATE users SET PasswordHash = ? WHERE email = ?", [newHash, email], (errUpdate, result) => {
                            if (errUpdate) throw errUpdate;
                            res.status(200).json({
                                "data": {}
                            });
                        });
                    });
                } else {
                    //hash compare failed, current password supplied is wrong!
                    res.status(401).json({
                        "error": {
                            "code": 401,
                            "message": "Current password is not correct! Please try again"
                        }
                    });
                }
            });
        });
    } else {
        res.status(401).json({
            "error": {
                "code": 401,
                "message": "User is not signed in!"
            }
        });
    }
}
