const pool = require("./pool")
async function login_query() {

}

async function signup_query(name, email, password) {
    await pool.query(` 
    INSERT INTO users (name, username, password, is_member)
        VALUES ($1, $2, $3, false);
    `, [name, email, password])
}

async function update_member_status_query(email, status) {
    await pool.query(`
        UPDATE users SET is_member = $1 
            WHERE username = $2;
    `, [status, email])
}

module.exports = {
    login_query,
    signup_query,
    update_member_status_query
}
