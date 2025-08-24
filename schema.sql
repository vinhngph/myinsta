CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    totp TEXT
);

CREATE TABLE user_informations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    birthday TEXT,
    phone TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_comments (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_follow (
    follower INTEGER NOT NULL,
    following INTEGER NOT NULL,
    FOREIGN KEY (follower) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (follower, following)
);

CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    attachment TEXT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE post_likes (
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (post_id, user_id)
);

CREATE TABLE post_comments (
    post_id TEXT NOT NULL,
    comment_id TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES user_comments(id) ON DELETE CASCADE,
    UNIQUE (post_id, comment_id)
);