const pool = require("./pool")
async function login_query() {

}

async function signup_query(name, email, password) {
    pool.query(` 
    INSERT INTO users (name, username, password, is_member)
        VALUES ($1, $2, $3, false);
    `, [name, email, password])
}

module.exports = {
    login_query,
    signup_query
}
