var mysql = require('mysql');

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
            res.status(200).json(rows[0]);
        } else {
            res.json({
                "success": "false"
            })
        }
    });
}

exports.search = async (req, res) => {
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
            res.status(200).json(rows);
        } else {
            res.json({
                "success": "false"
            });
        }
    });
}

exports.add = async (req, res) => {
    let productName = req.body.name;
    let UPC = req.body.UPC;
    let price = req.body.price;
    let cost = req.body.cost;
    let description = req.body.description;

    if (productName === undefined || UPC === undefined) {
        res.json({
            "success": "false"
        });
    } else {
        connection.query("INSERT INTO products (Title, UPC, Price, Cost, Description) VALUES (?, ?, ?, ?, ?)", [productName, UPC, price, cost, description], (err, res) => {
            if (err) throw err;
            console.log(res);
        });
    }

}