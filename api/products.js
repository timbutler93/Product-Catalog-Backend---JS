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
            res.json(rows[0]);
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
            res.json(rows);
        } else {
            res.json({
                "success": "false"
            });
        }
    });
}