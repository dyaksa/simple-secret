require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");
const localStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);


const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set("view engine", "ejs");



app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

const userShcema = new mongoose.Schema({
    username: String,
    password: String
});

userShcema.plugin(passportLocalMongoose);
userShcema.plugin(findOrCreate);

const User = mongoose.model("User", userShcema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    })
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secret",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },

    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/auth/google", function (req, res) {
    passport.authenticate("google", {
        scope: ["profile"]
    });
});

app.route("/login")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.redirect("/secret");
        } else {
            res.render("login");
        }
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function (err) {
            if (err) throw err;
            req.login(user, function (err) {
                if (err) throw err;
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secret");
                });
            });
        })
    });

app.route("/register")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.redirect("/secret");
        } else {
            res.render("register");
        }

    })
    .post((req, res) => {
        User.register({
            username: req.body.username
        }, req.body.password, function (err, user) {
            if (err) throw err;
            res.redirect("/login");
        });
    });

app.get("/secret", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/submit", function (req, res) {
    res.render("submit");
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/login");
});

app.listen(process.env.PORT || 3000, function () {
    console.log("server berjalan");
});