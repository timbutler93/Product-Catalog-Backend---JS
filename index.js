let express = require("express");
let app = express();
let session = require("express-session");
let dotenv = require('dotenv').config();
let users = require('./api/users');
let products = require('./api/products');

app.use(session({
    secret: process.env.secret,
    resave: true,
    saveUninitialized: true
}));
app.use(express.json());

app.listen(3000, () => {
    console.log("Server running on port 3000");
    //connection.connect();
});

app.get("/ping", (req, res) => {
    res.json({
        "success": "true"
    });
});

//return product of given id
app.get("/products/:id", products.product);
//browse products
app.get("/products", products.search);
//login with username and password in json
app.post("/user/login", users.login);
//get current acccount info
app.get("/user", users.info);
//logout of account
app.get("/user/logout", users.logout);
//new user
app.post("/user/new", users.newUser);
//change password
app.put("/user/password", users.changePassword);
//add product
app.post("/product/new", products.add);