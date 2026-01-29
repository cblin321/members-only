require("dotenv").config()
const pg = require("pg")
const pool = new pg.Pool({ connectionString: process.env.CONNECTION_URL })
console.log("connection string" + process.env.CONNECTION_URL)
module.exports = pool
