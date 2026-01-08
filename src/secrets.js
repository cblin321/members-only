require("dotenv").config()

module.exports = {
    CONNECTION_URL: process.env.CONNECTION_URL,
    SESSION_SECRET: process.env.SESSION_SECRET
}
