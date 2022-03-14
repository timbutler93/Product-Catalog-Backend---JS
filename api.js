var mysql = require('mysql');
let bcrypt = require("bcrypt");

var connection = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database
})

exports.product = async (req, res) => {
    let queryString = "SELECT ID, Title, UPC, Price, Description, Brand, Category, MPN, SKU, Image FROM products WHERE Active is not null AND ID=?";

    connection.query(queryString, req.params.id, (err, rows, _) => {
        if (err) throw err

        if (rows.length === 1) {
            res.json(rows[0]);
        } else {
            res.json({
                "success": "false"
            })
        }
    });
}

exports.products = async (req, res) => {
    let page = parseInt(req.query.page);
    if (page === undefined || page < 0 || isNaN(page)) page = 0

    let pageSize = parseInt(req.query.pageSize);
    if (pageSize === undefined || pageSize < 1 || isNaN(pageSize)) pageSize = 10

    let searchString = req.query.searchString;
    let queryString = "SELECT ID, Title, UPC, Price, Description, Image FROM products WHERE Active is not NULL LIMIT ?, ?";
    let parameters = [page, pageSize];
    if (searchString !== undefined) {
        queryString = "SELECT ID, Title, UPC, Price, Description, Image FROM products WHERE Active is not NULL AND CONCAT(Title, UPC, Description, SKU, MPN) REGEXP ? LIMIT ?, ?";
        parameters.unshift(searchString.split(" ").join("|"));
    }
    connection.query(queryString, parameters, function(err, rows, _) {
        if (err) throw err

        if (rows.length > 0) {
            res.json(rows);
        } else {
            res.json({
                "success": "false"
            });
        }
    });
}

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
                    res.json({
                        "sucess": "true"
                    });
                } else //password does not match
                {
                    res.json({
                        "sucess": "false"
                    });
                }
            });

        }
    });
}

exports.user = async (req, res) => {
    //return username and id if in valid session
    if (req.session.loggedIn) {
        res.json({
            "username": req.session.username,
            "ID": req.session.ID
        });
    } else {
        res.json({
            "sucess": "false"
        });
    }
}

exports.newUser = async (req, res) => {
    //if logged in, already have account
    if (req.session.loggedIn) {
        res.json({
            "success": "false"
        });
    } else {
        let email = req.body.username;
        let password = req.body.password;
        //check to see if no other user exist with that email
        connection.query("SELECT * FROM users WHERE email = ?", email, (err, rows, _) => {
            if (rows.length > 0) {
                res.json({
                    "success": "false"
                });
            } else {
                //hash password and insert information into database
                bcrypt.hash(password, 10, (errHash, hash) => {
                    if (errHash) throw errHash;
                    connection.query("INSERT INTO users (email, PasswordHash, Access) VALUES (?, ?, ?)", [email, hash, 0], (errInsert, result) => {
                        if (errInsert) throw errInsert;
                        res.json({
                            "success": "true"
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
        res.json({
            "success": "true"
        });
    } else
        res.json({
            "success": "false"
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
                            res.json({
                                "success": "true"
                            });
                        });
                    });
                } else {
                    //hash compare failed, current password supplied is wrong!
                    res.json({
                        "success": "false"
                    });
                }
            });
        });
    } else {
        res.json({
            "success": "false"
        });
    }
}