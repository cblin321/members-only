const queries = require("../models/queries.js")
const bcrypt = require("bcryptjs")
const { MEMBERSHIP_PASS } = require("../secrets")


async function signup(name, email, password) {
    const hash = await bcrypt.hash(password, 10)

    try {
        await queries.signup_query(name, email, hash)
    } catch (err) {
        return [{ msg: err.toString() }]
    }

    return []
}

async function update_member_status(email, status) {
    try {
        await queries.update_member_status_query(email, status)
    } catch (err) {
        return [{ msg: err.toString() }]
    }
}

async function update_admin_status(email, status) {
    try {
        await queries.update_admin_status_query(email, status)
    } catch (err) {
        return [{ msg: err.toString() }]
    }
}

module.exports = {
    signup,
    update_member_status,
    update_admin_status
}
