Nalanda Library Management System

A full-stack Library Management System built with Node.js, providing both REST API and GraphQL API for managing books, members, borrowing activity, and reports.

Features

Authentication & Authorization

Secure login using JWT
Role-based access: Admin and Member
Extra encryption layer using Crypto-JS

Book Management

Add, update, delete books (Admin only)
Get all books, single book, paginated books
Validation included using express-validator

Member System

Admin creates members
Members can browse books and borrow books
JWT-based protected routes,

Borrowing System
Issue a book
Return a book
Prevents duplicate issuing
Tracks due dates and overdue items,

Report Generation

Most borrowed books
Member borrowing history
Overdue books report,

Dual API Support

Fully documented GraphQL API
Fully documented REST API,

Tech Stack

Node.js / Express.js
MongoDB / Mongoose
GraphQL + Apollo Server
REST API
JWT Authentication
Express Validator
Crypto-JS
CORS

Installation

Clone the Repository

git clone https://github.com/Noman1221/Nalanda_Library_Management.git

Install Dependencies
npm install

Configure Environment
Create a .env file:

PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/yourDB

JWT_SECRET=your secret key
JWT_EXPIRE=7d
JWT_ENCRYPTION_KEY=your encription secret key

ALLOWED_ORIGINS=http://localhost:3000

Start the Server

Development mode:
npm run dev

Production mode:
npm start

API Documentation
GraphQL API Postman
https://documenter.getpostman.com/view/42363556/2sB3dJysBR

Features documented:

Authentication (Admin + Member)
Book queries & mutations
Borrowing system
Reports via GraphQL

REST API Postman
https://documenter.getpostman.com/view/42363556/2sB3dJyXhS

Features documented:

Auth routes
Book CRUD
Borrow/Return system
Admin protected routes
Reports

Basic Usage Examples
REST: Create Book (Admin)

POST /api/books
{
"title": "The Alchemist",
"author": "Paulo Coelho",
"genre": "Fiction",
"copies": 4
}

GraphQL: Fetch Books
query {
books {
id
title
author
}
}
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/990bb254-e4de-40b0-88e6-f26cd4f8c585" />
