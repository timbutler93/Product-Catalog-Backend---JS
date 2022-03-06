let express = require("express");
let app = express();
var mysql = require('mysql');
let dotenv = require('dotenv').config();

var connection = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database
})

app.listen(3000, () => {
    console.log("Server running on port 3000");
    //connection.connect();
});

app.get("/ping", (req, res) => {
    res.json({
        "success": "true"
    });
});

app.get("/product/:id", (req, res) => {
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

});

app.get("/products", (req, res) => {

    let page = parseInt(req.query.page);
    if (page === undefined || page < 0 || isNaN(page)) page = 0

    let pageSize = parseInt(req.query.pageSize);
    if (pageSize === undefined || pageSize < 1 || isNaN(pageSize)) pageSize = 10

    let searchString = req.query.searchString;
    let queryString = "SELECT ID, Title, UPC, Price, Description, Image FROM products WHERE Active is not NULL LIMIT ?, ?";
    let parameters = [page, pageSize];
    if (searchString !== undefined) {
        queryString = "SELECT ID, Title, UPC, Price, Description, Image FROM products WHERE Active is not NULL AND CONCAT(Title, UPC, Description, SKU, MPN) REGEXP ? LIMIT ?, ?";
        parameters = [searchString, page, pageSize];
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
});