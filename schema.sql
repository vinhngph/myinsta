CREATE TABLE users(
    id INTEGER NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (id, email)
)