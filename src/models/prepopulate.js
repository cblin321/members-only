const fs = require("node:fs");
const pool = require("./pool");
const path = require("path");
const bcrypt = require("bcryptjs");

const users = [
    {
        name: "test 1",
        password: bcrypt.hashSync("123", 10),
        username: "1@example.com",
        is_member: true,
        is_admin: true,
    },
    {
        name: "test 2",
        password: bcrypt.hashSync("456", 10),
        username: "2@example.com",
        is_member: true,
        is_admin: false,
    },
    {
        name: "test 3",
        password: bcrypt.hashSync("789", 10),
        username: "3@example.com",
        is_member: false,
        is_admin: false,
    },
];

const posts = [
    {
        username: "1@example.com",
        title: "hello world",
        body: "my 1st post",
    },
    {
        username: "2@example.com",
        title: "1232*(&^*($#",
        body: "test",
    },
];

const insert_template = (table, mapping) => {
    const cols = Object.keys(mapping).join(",");
    const values = Object.values(mapping)
        .map((val) => (typeof val === "string" ? `\'${val}\'` : val))
        .join(", ");
    return `
            INSERT INTO ${table} (${cols})
                VALUES (${values}); 
    `;
};

const populate = async () => {
    const conn = await pool.connect();
    try {
        await conn.query("BEGIN");
        const schema = fs.readFileSync(
            path.join(__dirname, "schema.sql"),
            "utf-8",
        );
        console.log(schema);
        await conn.query(schema);

        const user_query = users
            .map((user) => insert_template("users", user))
            .join("\n");

        console.log(user_query);

        await conn.query(user_query);

        const posts_query = posts
            .map((post) => insert_template("posts", post))
            .join("\n");

        console.log(posts_query);

        await conn.query(posts_query);

        await conn.query("COMMIT");
    } catch (err) {
        console.error("something went wrong populating db", err);
        await conn.query("ROLLBACK");
    } finally {
        conn.release();
    }
};

populate();
