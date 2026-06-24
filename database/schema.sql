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

INSERT INTO wines (id, name, winery, type, year, sweetness, image)
VALUES
(1, 'Yarden Syrah', 'Golan Heights Winery', 'Red', 2020, 'Dry', '../images/wine_images/syrah.jpg'),
(2, 'Mt. Amasa', 'Yatir', 'Red', 2019, 'Dry', '../images/wine_images/amasa.jpg'),
(3, 'Galil Mountain Rosé', 'Galil Mountain', 'Rosé', 2022, 'Dry', '../images/wine_images/rose.jpg'),
(4, 'Sauvignon Blanc', 'Pelter', 'White', 2021, 'Dry','../images/wine_images/sauvignon.jpg'),
(5, 'Yarden Chardonnay', 'Golan Heights Winery', 'White', 2021, 'Dry', '../images/wine_images/chardonnay.jpg'),
(6, 'Rose', 'Pelter', 'Rose', 2025, 'Dry', '../images/wine_images/rose_pelter_rose_2025.png'),
(7, 'Cabernet Shiraz', 'Pelter', 'Red', 2024, 'Dry', '../images/wine_images/cabernetShiraz_pelter_red_2024.png'),
(8, 'Gewurztraminer', 'Pelter', 'White', 2024, 'Dry', '../images/wine_images/gewurztraminer_pelter_white_2024.png'),
(9, 'Chardonnay', 'Matar', 'White', 2025, 'Dry', '../images/wine_images/chardonnay_matar_white_2025.png'),
(10, 'Cabernet Sauvignon', 'Matar', 'Red', 2023, 'Dry', '../images/wine_images/cabernetSauvignon_matar_red_2023.png'),
(11, 'Blanc de noir - Sparkling', 'Matar', 'White', 2023, 'Dry', '../images/wine_images/blancDeNoir_matar_white_2023.png'),
(12, 'Rose', 'Teperberg', 'Rose', 2023, 'Dry', '../images/wine_images/rose_teperberg_rise_2023.png'),
(13, 'Malbec', 'Teperberg', 'Red', 2020, 'Dry', '../images/wine_images/malbec_teperberg_red_2020.png'),
(14, 'Merlot', 'Teperberg', 'Red', 2020, 'Dry', '../images/wine_images/merlot_teperberg_red_2020.png'),
(15, 'Cabernet Sauvignon', 'Teperberg', 'Red', 2020, 'Dry', '../images/wine_images/cabernetSauvignon_teperberg_red_2020.png'),
(16, 'Shiraz', 'Teperberg', 'Red', 2020, 'Dry', '../images/wine_images/shiraz_teperberg_red_2020.png'),
(17, 'Sauvignon Blanc', 'Shvo Vineyards', 'White', 2025, 'Dry', '../images/wine_images/sauvignonBlanc_shvo_white_2025.png'),
(18, 'Rose', 'Shvo Vineyards', 'Rose', 2025, 'Dry', '../images/wine_images/rose_shvo_rose_2025.png'),
(19, 'Sauvignon Blanc', 'MIDBAR', 'White', 2023, 'Dry', '../images/wine_images/sauvignonBlanc_midbar_white_2023.png'),
(20, 'Chardonnay', 'MIDBAR', 'White', 2022, 'Dry', '../images/wine_images/chardonnay_midbar_white_2022.png');