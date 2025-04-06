create database bakerysystem

create table users(
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(50),
    name VARCHAR(50),
    email VARCHAR(50),
    mobilenumber VARCHAR(50)
    );

create table feedback(
    feedbackid INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    feedbacktext text
    );

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    shipping_address TEXT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status ENUM('payment pending','confirmed','shipped','rejected') DEFAULT 'payment pending',
    items JSON NOT NULL 
);

