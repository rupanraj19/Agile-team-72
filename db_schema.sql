-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL
);

-- adminpass
INSERT INTO users (user_name, password, email)
VALUES
('admin', '$2b$10$M0R32kVypC3o4r94l7EQse1FTgMEmGwSLZRogeBI2UjMcC9kHpiiy', 'admin@example.com');

ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN token_expiry TEXT;

-- Create articles table
-- This table stores articles.
-- Create cna_articles table
CREATE TABLE IF NOT EXISTS cna_articles (
    article_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    category TEXT NOT NULL,
    scraped_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create mhf_articles table
CREATE TABLE IF NOT EXISTS mhf_articles (
    article_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    scraped_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
-- This table stores comments made on articles.
-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER,
    article_type TEXT CHECK(article_type IN ('cna', 'mhf')),
    user_id INTEGER,
    comment TEXT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create likes table
-- This table stores likes on articles by users.
CREATE TABLE IF NOT EXISTS likes (
    like_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    article_id INTEGER,
    article_type TEXT CHECK(article_type IN ('cna', 'mhf')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    -- You might need application-level checks for article existence and type
);


-- Create programs table
-- This table stores programs.
CREATE TABLE IF NOT EXISTS programs (
    program_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
