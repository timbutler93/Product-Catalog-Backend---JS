let express = require("express");
let app = express();
let session = require("express-session");
let dotenv = require('dotenv').config();
let api = require('./api');

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
app.get("/product/:id", api.product);
//browse products
app.get("/products", api.products);
//login with username and password in json
app.post("/login", api.login);
//get current acccount info
app.get("/user", api.user);
//logout of account
app.get("/logout", api.logout);
//new user
app.post("/user/new", api.newUser);