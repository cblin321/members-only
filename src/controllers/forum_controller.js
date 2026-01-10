const queries = require("../models/queries.js")
async function create_new_post(title, body, email) {
    try {
        await queries.create_new_post_query(title, body, email)
    } catch (err) {
        return [{ msg: err.toString() }]
    }
}

module.exports = {
    create_new_post
}
