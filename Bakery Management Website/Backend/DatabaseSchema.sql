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

