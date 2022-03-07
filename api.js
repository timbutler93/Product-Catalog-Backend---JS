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

    connection.query(queryString, req.params.id, function(err, rows, _) {
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

    connection.query("SELECT * FROM users WHERE email = ?", username, function(err, rows, _) {
        if (err) throw err

        if (rows.length === 1) {
            //compare bcrypt from PHP generated hash
            bcrypt.compare(password, rows[0]['PasswordHash'].replace("$2y$", "$2a$")).then(function(hashRes) {
                if (hashRes) {
                    req.session.loggedin = true;
                    req.session.username = username;
                    req.session.ID = rows[0]['ID'];
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
    if (req.session.loggedin) {
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

exports.logout = async (req, res) => {
    //destroy session
    if (req.session.loggedin) {
        req.session.destroy();
        res.json({
            "sucess": "true"
        });
    } else
        res.json({
            "success": "false"
        });
}