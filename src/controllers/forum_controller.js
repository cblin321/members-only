const queries = require("../models/queries.js");
async function create_new_post(title, body, email) {
    try {
        await queries.create_new_post_query(title, body, email);
    } catch (err) {
        console.error(err);
        return [{ msg: err.toString() }];
    }
}

async function delete_post(pid) {
    try {
        await queries.delete_post_query(pid);
    } catch (err) {
        console.error(err);
        return [{ msg: err.toString() }];
    }
}

async function get_all_posts() {
    try {
        const rows = await queries.get_all_posts_query();
        return {
            rows: rows.map((row) => {
                return {
                    ...row,
                    created: `${row.created.getMonth() + 1}/${row.created.getDate()}/${row.created.getFullYear()}`,
                };
            }),
        };
    } catch (err) {
        return {
            errors: [{ msg: err.toString() }],
        };
    }
}

module.exports = {
    get_all_posts,
    create_new_post,
    delete_post,
};
