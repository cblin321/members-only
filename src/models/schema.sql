DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS session;

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

CREATE TABLE users (
    uid INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT,
    username TEXT UNIQUE,
    password TEXT,
    is_member BOOLEAN
);

CREATE TABLE posts (
    pid INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    uid INTEGER REFERENCES users(uid) ON DELETE CASCADE,
    title TEXT,
    body TEXT,
    created TIMESTAMP DEFAULT NOW()
);

