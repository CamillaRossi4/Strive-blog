# Strive Blog

Strive Blog is a full-stack blogging application developed for EPICODE Module 6.

The project allows users to read articles, create an account, publish posts and interact through comments.

## Technologies

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Passport.js and Cloudinary.

**Frontend:** React, Vite, JavaScript and CSS.

## Features

- View and read blog posts
- Register and log in
- Log in with Google
- Create, edit and delete personal posts
- Upload images with Cloudinary
- Add, edit and delete comments
- Search posts by title
- Pagination
- Responsive design

## How to Run

Clone the repository and install the dependencies.

**Backend**

Open a terminal in the main project folder:

```bash
npm install
npm run dev
```

Create a `.env` file with the required MongoDB, JWT, Cloudinary and Google OAuth configuration.

The backend runs on `http://localhost:3001`.

**Frontend**

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## API

The backend includes REST API endpoints for:

- `/auth` — Registration, login and authentication
- `/authors` — Author management
- `/blogPosts` — Blog posts and comments

Some operations require authentication with a JWT token.

API requests can be tested using the `test.http` file.

## Author

Camilla Rossi
Full Stack Web Development Student  
EPICODE
