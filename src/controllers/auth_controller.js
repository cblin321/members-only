const queries = require("../models/queries.js")
const bcrypt = require("bcryptjs")

async function login() {

}

async function signup(name, email, password) {
    const hash = await bcrypt.hash(password, 10)

    try {
        await queries.signup_query(name, email, hash)
    } catch (err) {
        console.err("signup query failed", err.msg)
        return [err]
    }

    return []
}

module.exports = {
    login,
    signup
}
