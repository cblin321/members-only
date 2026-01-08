const express = require("express")
const pool = require("../models/pool.js")
const session = require("express-session")
const {
    body,
    query,
    validationResult,
    matchedData
} = require('express-validator');

const { SESSION_SECRET } = require("../secrets")
const auth_controller = require("../controllers/auth_controller")
const passport = require("passport")
const LocalStrategy = require('passport-local').Strategy

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
            const user = rows[0];

            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }
            if (user.password !== password) {
                return done(null, false, { message: "Incorrect password" });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);


passport.serializeUser((user, done) => {
    done(null, user.username);
});

passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        const user = rows[0];

        done(null, user);
    } catch (err) {
        done(err);
    }
});


const index_router = express.Router()
index_router.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: pool
}))
index_router.use(passport.session())

//validate name & email
const credentials_validator = [
    body("email").isEmail().withMessage("Must provide a valid email")
]

//
const confirm_password = [
    body("confirm_password").custom((value, { req }) => {
        if (value !== req.body.password)
            return false
        return true
    }).withMessage("Passwords must match"),

]

const generateValidators = (fields) => {
    return fields.map(key => body(key).notEmpty().escape())
}

index_router.get("/login", (req, res) => {
    res.render("login")
})

index_router.post("/login", async (req, res) => {

})

index_router.get("/signup", (req, res) => {
    res.render("signup")
})

index_router.post("/signup", generateValidators([
    "name",
    "email",
    "confirm_password",
    "password"
]), credentials_validator, confirm_password, async (req, res) => {
    let errors = validationResult(req).errors
    console.log(errors)
    if (errors.length > 0)
        return res.status(400).render("signup", { errors })
    const { name, email, password } = matchedData(req)
    errors = await auth_controller.signup(name, email, password)
    if (errors.length > 0)
        return res.status(500).render("signup", { errors: errors })
    return res.redirect("/login")
})

module.exports = index_router
