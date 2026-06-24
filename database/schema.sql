CREATE DATABASE IF NOT EXISTS wineder_db;
USE wineder_db;


CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(100),
    points INT DEFAULT 0,
    level VARCHAR(50) DEFAULT 'Casual Sipper',
    streak INT DEFAULT 0,
    daily_swipes_count INT DEFAULT 0,
    last_active_date DATE
);


CREATE TABLE IF NOT EXISTS wines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    winery VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    year INT,
    image VARCHAR(255)
    sweetness VARCHAR(50)
);


CREATE TABLE IF NOT EXISTS user_cellar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    wine_id INT NOT NULL,
    UNIQUE (user_email, wine_id),
    FOREIGN KEY (user_email) REFERENCES users(email),
    FOREIGN KEY (wine_id) REFERENCES wines(id)
);

USE wineder_db;


CREATE TABLE IF NOT EXISTS custom_wines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    winery VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    year INT,
    image VARCHAR(255),
    FOREIGN KEY (user_email) REFERENCES users(email)
);


USE wineder_db;

ALTER TABLE users
ADD COLUMN lastName VARCHAR(100) AFTER firstName;

ALTER TABLE users
ADD COLUMN wine_preferences TEXT AFTER lastName;

