const express = require("express");
const pool = require("../models/pool.js");
const session = require("express-session");
const pg_session = require("connect-pg-simple")(session);
const {
    body,
    query,
    validationResult,
    matchedData,
} = require("express-validator");

const { SESSION_SECRET, ADMIN_PASS } = require("../secrets");
const auth_controller = require("../controllers/auth_controller");
const forum_controller = require("../controllers/forum_controller.js");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local").Strategy;

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const { rows } = await pool.query(
                "SELECT * FROM users WHERE username = $1",
                [username],
            );
            const user = rows[0];

            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }

            if (!(await bcrypt.compare(user.password, password))) {
                return done(null, false, { message: "Incorrect password" });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }),
);

passport.serializeUser((user, done) => {
    done(null, user.username);
});

passport.deserializeUser(async (username, done) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username],
        );
        const user = rows[0];

        done(null, user);
    } catch (err) {
        done(err);
    }
});

const index_router = express.Router();
index_router.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new pg_session({
            pool: pool,
            tableName: "session",
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24,
        },
    }),
);
index_router.use(passport.session());
index_router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

index_router.use(flash());

//validate name & email
const credentials_validator = [
    body("email").isEmail().withMessage("Must provide a valid email"),
];

const membership_secrets_validator = [
    body("secret")
        .trim()
        .isString()
        .equals("cat")
        .withMessage("Wrong pwd, try again!"),
];

//
const confirm_password = [
    body("confirm_password")
        .custom((value, { req }) => {
            if (value !== req.body.password) return false;
            return true;
        })
        .withMessage("Passwords must match"),
];

const generate_validators = (fields) => {
    return fields.map((key) => body(key).notEmpty().escape());
};

index_router.get("/", async (req, res) => {
    const posts = await forum_controller.get_all_posts();
    if (posts?.errors) {
        posts.errors((err) => req.flash("errors", err));
        return res.status(500).render("/", { errors: req.flash("errors") });
    }

    const msgs = req.flash("msgs");
    res.render("index", { posts: posts.rows, msgs: msgs });
});

index_router.get("/login", (req, res) => {
    res.render("login");
});

index_router.post(
    "/login",
    generate_validators(["username", "password"]),
    (req, res, next) => {},
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login",
    }),
);

index_router.get("/signup", (req, res) => {
    res.render("signup");
});

index_router.post(
    "/signup",
    generate_validators(["name", "email", "confirm_password", "password"]),
    credentials_validator,
    confirm_password,
    async (req, res) => {
        let errors = validationResult(req).errors;
        if (errors.length > 0)
            return res.status(500).render("signup", { errors });
        const { name, email, password } = matchedData(req);
        errors = await auth_controller.signup(name, email, password);
        if (errors.length > 0)
            return res.status(500).render("signup", { errors: errors });
        return res.redirect("/login");
    },
);

index_router.get("/secret", async (req, res) => {
    if (!req.isAuthenticated())
        return res.status(401).render("secret", {
            errors: [{ msg: "You need to be logged in to view this page." }],
        });
    return res.render("secret");
});

index_router.post(
    "/secret",
    membership_secrets_validator,
    generate_validators(["secret"]),
    async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).render("secret", {
                errors: [{ msg: "You need to be logged to become a member." }],
            });
        let errors = validationResult(req).errors;
        if (errors.length > 0) return res.render("secret", { errors: errors });
        errors = await auth_controller.update_member_status(
            req.user.username,
            true,
        );
        if (errors?.length > 0)
            return res.status(500).render("secret", { errors: errors });
        req.flash("msgs", "Congrats! You are a member");
        res.redirect("/");
    },
);

index_router.post("/logout", async (req, res) => {
    if (req.isAuthenticated()) {
        return req.logout((err) => {
            if (err) return next(err);
            req.flash("msgs", "Logged out!");
            return res.redirect("/");
        });
    }

    return res.redirect("/");
});

index_router.get("/post/create", async (req, res) => {
    if (!req.isAuthenticated())
        return res.status(401).render("create_post", {
            errors: [{ msg: "You must to be logged in to post. " }],
        });

    if (!req?.user?.is_member)
        return res.status(401).render("create_post", {
            errors: [{ msg: "You must to be a member to post." }],
        });
    const errors = req.flash("errors");
    return res.render("create_post", { errors: errors });
});

index_router.post(
    "/post/create",
    generate_validators(["title", "body"]),
    async (req, res) => {
        if (!req.isAuthenticated()) {
            req.flash("errors", { msg: "You must to be logged in to post. " });
            return res.status(401).redirect("/post/create");
        }

        if (!req?.user?.is_member) {
            req.flash("errors", { msg: "You must be a member to post." });
            return res.status(401).redirect("/post/create");
        }

        const { title, body } = req.body;
        const errors = await forum_controller.create_new_post(
            title,
            body,
            req.user.username,
        );

        if (errors?.length > 0) {
            errors.forEach((err) => req.flash("errors", err));
            return res.status(500).redirect("/post/create");
        }

        req.flash("msgs", "Post created!");
        return res.redirect("/");
    },
);

index_router.get(
    "/admin",
    generate_validators(["password"]),
    async (req, res) => {
        if (!req?.user?.is_member) {
            req.flash("errors", {
                msg: "You must be an member to become an admin.",
            });
            return res.redirect("/admin");
        }

        if (!req?.isAuthenticated()) {
            req.flash("errors", {
                msg: "You must be logged in to become an admin.",
            });
            return res.redirect("/admin");
        }

        res.render("admin", { errors: req.flash("errors") });
    },
);

index_router.post("/admin", async (req, res) => {
    const { password } = req.body;
    if (password !== ADMIN_PASS) {
        req.flash("errors", { msg: "Admin password was incorrect" });
        return res.status(401).redirect("/admin");
    }

    const errors = await auth_controller.update_admin_status(email, true);
    if (errors?.length > 0) {
        errors.forEach((err) => req.flash("errors", err));
        return res.status(500).redirect("/admin");
    }

    req.flash("msgs", "You are now an admin.");
    return res.redirect("/");
});

module.exports = index_router;
