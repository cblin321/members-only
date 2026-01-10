const express = require("express")
const pool = require("../models/pool.js")
const session = require("express-session")
const pg_session = require("connect-pg-simple")(session)
const {
    body,
    query,
    validationResult,
    matchedData
} = require('express-validator');

const { SESSION_SECRET } = require("../secrets")
const auth_controller = require("../controllers/auth_controller")
const forum_controller = require("../controllers/forum_controller.js")
const passport = require("passport")
const bcrypt = require("bcryptjs")
const LocalStrategy = require('passport-local').Strategy

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            console.log(username, password)
            const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
            console.log("rows", rows)
            const user = rows[0];

            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }

            if (!bcrypt.compare(user.password, password)) {
                return done(null, false, { message: "Incorrect password" });
            }
            console.log("successful login")
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);


passport.serializeUser((user, done) => {
    done(null, user.username);
});

passport.deserializeUser(async (username, done) => {
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
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
    store: new pg_session({
        pool: pool,
        tableName: "session",
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}))
index_router.use(passport.session())
index_router.use((req, res, next) => {
    res.locals.user = req.user
    next()
})

//validate name & email
const credentials_validator = [
    body("email").isEmail().withMessage("Must provide a valid email")
]

const membership_secrets_validator = [
    body("secret").trim().isString().equals("cat").withMessage("Wrong pwd, try again!")
]

//
const confirm_password = [
    body("confirm_password").custom((value, { req }) => {
        if (value !== req.body.password)
            return false
        return true
    }).withMessage("Passwords must match"),

]

const generate_validators = (fields) => {
    return fields.map(key => body(key).notEmpty().escape())
}

index_router.get("/", (req, res) => {
    res.render("index")
})

index_router.get("/login", (req, res) => {
    res.render("login")
})

index_router.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
}))

index_router.get("/signup", (req, res) => {
    res.render("signup")
})

index_router.post("/signup", generate_validators([
    "name",
    "email",
    "confirm_password",
    "password"
]), credentials_validator, confirm_password, async (req, res) => {
    let errors = validationResult(req).errors
    if (errors.length > 0)
        return res.status(500).render("signup", { errors })
    const { name, email, password } = matchedData(req)
    errors = await auth_controller.signup(name, email, password)
    if (errors.length > 0)
        return res.status(500).render("signup", { errors: errors })
    return res.redirect("/login")
})

index_router.get("/secret", async (req, res) => {
    if (!req.isAuthenticated())
        return res.status(401).render("secret", {
            errors: [{ msg: "You need to be logged in to view this page." }]
        })
    return res.render("secret")
})

index_router.post("/secret", membership_secrets_validator, generate_validators(["secret"]), async (req, res) => {
    if (!req.isAuthenticated())
        return res.status(401).render("secret", {
            errors: [{ msg: "You need to be logged to become a member." }],
        })
    const errors = validationResult(req).errors
    if (errors.length > 0)
        return res.render("secret", { errors: errors })
    errors = await auth_controller.update_member_status(req.user.username, true)
    if (errors.length > 0)
        return res.status(500).render("secret", { errors: errors })
    return res.render("index", { msgs: ["Congrats! You are a member"] })
})

index_router.post("/logout", async (req, res) => {
    if (req.isAuthenticated()) {
        req.logout()
        return res.status(200).render("/index")
    }

    return res.redirect("/index", { errors: [{ msg: "You must be logged in to log out. " }] })
})

index_router.get("/post/create", async (req, res) => {
    if (!req.isAuthenticated())
        return res.status(401).render("create_post", { errors: [{ msg: "You must to be logged in to post. " }] })

    if (!req?.user?.is_member)
        return res.status(401).render("create_post", { errors: [{ msg: "You must to be a member to post." }] })

    return res.render("create_post")
})

index_router.post("/post/create", async (req, res) => {
    if (!req.isAuthenticated())
        return res.status(401).render("create_post", { errors: [{ msg: "You must to be logged in to post. " }] })

    if (!req?.user?.is_member)
        return res.status(401).render("create_post", { errors: [{ msg: "You must to be a member to post." }] })

    const { title, body } = req.body
    const errors = await forum_controller.create_new_post(title, body, req.user.email)

    if (errors.length > 0)
        return res.status(500).render("create_post", { errors: errors })

    return res.render("index", { msgs: ["Post created!"] })
})

module.exports = index_router
