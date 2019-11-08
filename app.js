const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userShcema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    email: String,
    password: String
});

const secret = "thesecretkey";
const encKey = process.env.SOME_32BYTE_BASE64_STRING;
const sigkey = process.env.SOME_64BYTE_BASE64_STRING;

userShcema.plugin(encrypt, {
    secret: secret,
    encryptionKey: encKey,
    signingKey: sigkey,
    encryptedFields: ["password"]
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
                if (user.password === password) {
                    console.log("match found");
                    res.redirect("/secret");
                } else {
                    console.log("password not match");
                }
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
        const user = new User({
            _id: new mongoose.Types.ObjectId(),
            email: req.body.username,
            password: req.body.password
        });

        user.save(function (err) {
            if (err) throw err;
            res.redirect("/secret");
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