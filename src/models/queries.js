const pool = require("./pool")

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

async function create_new_post_query(title, body, name) {
    await pool.query(`
        INSERT INTO posts (title, body, author)
        VALUES (title=$1, body=$2, author=$3);
    `, [title, body, name])
}

module.exports = {
    signup_query,
    update_member_status_query,
    create_new_post_query
}
