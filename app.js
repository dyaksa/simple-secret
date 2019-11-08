require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userShcema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    email: String,
    password: String
});

const User = mongoose.model("User", userShcema);

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set("view engine", "ejs");

app.get("/", function (req, res) {
    res.render("home");
});

app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        const email = req.body.username;
        const password = req.body.password;
        User.findOne({
            email: email
        }, function (err, user) {
            if (err) throw err;
            if (user) {
                bcrypt.compare(password, user.password, function (err, match) {
                    if (err) throw err;
                    if (match) res.redirect("/secret");
                });
            } else {
                console.log("user not found");
            }
        });
    });

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) throw err;
            bcrypt.hash(req.body.password, salt, function (err, hash) {
                if (err) throw err;
                const user = new User({
                    _id: new mongoose.Types.ObjectId(),
                    email: req.body.username,
                    password: hash
                });

                user.save(function (err) {
                    if (err) throw err;
                    res.redirect("/secret");
                });
            });
        });
    });

app.get("/secret", function (req, res) {
    res.render("secrets");
});

app.get("/submit", function (req, res) {
    res.render("submit");
});

app.listen(process.env.PORT || 3000, function () {
    console.log("server berjalan");
});