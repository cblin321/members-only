const pool = require("./pool")

async function get_all_posts_query() {
    const { rows } = await pool.query(`
        SELECT * FROM posts JOIN users ON posts.username = users.username;
    `)
    console.log("uqer posts", rows)
    return rows
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

async function create_new_post_query(title, body, email) {
    await pool.query(`
        INSERT INTO posts (title, body, username)
        VALUES ($1, $2, $3);
    `, [title, body, email])
}

module.exports = {
    get_all_posts_query,
    signup_query,
    update_member_status_query,
    create_new_post_query
}
