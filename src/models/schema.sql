DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS users;

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

CREATE TABLE users (
    username TEXT PRIMARY KEY,
    name TEXT,
    password TEXT,
    is_member BOOLEAN,
    is_admin BOOLEAN
);

CREATE TABLE posts (
    pid INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username TEXT REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
    title TEXT,
    body TEXT,
    created TIMESTAMP DEFAULT CLOCK_TIMESTAMP()
);

