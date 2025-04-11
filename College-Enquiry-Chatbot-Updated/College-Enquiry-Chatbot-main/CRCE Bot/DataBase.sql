--Create database
create database register;

--Create Users Table
create table users(
name varchar(30), 
email varchar(30), 
password varchar(15)
);

--Create Table Suggestions
create table suggestion(
email varchar(30), 
message varchar(255)
);