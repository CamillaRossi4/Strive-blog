# Strive Blog — Frontend

Strive Blog is a full-stack blogging application built as the final project for EPICODE Module 6.

The frontend is developed with React and Vite. It has a minimal editorial design and allows users to read articles, create an account and share their opinions.

## Technologies

- React
- Vite
- JavaScript
- CSS
- Fetch API

## Features

- View published articles
- Read individual articles and comments
- Register and log in with email and password
- Log in with Google
- Create, edit and delete your own articles
- Publish comments
- Responsive layout for desktop and mobile devices

## Getting Started

Open a terminal inside the `frontend` folder.

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

## Backend

The frontend communicates with the Strive Blog backend, built with Node.js, Express and MongoDB.

The backend must be running at `http://localhost:3001` for the application to work correctly.

## Project Structure

- `src/App.jsx` — Main application and page navigation
- `src/PostEditor.jsx` — Article creation and editing
- `src/App.css` — Application styling
- `src/index.css` — Global styles
- `src/main.jsx` — React entry point

## Available Scripts

- `npm run dev` — Start the development server
- `npm run build` — Create a production build
- `npm run lint` — Check the code with ESLint
- `npm run preview` — Preview the production build

## Author

Camilla Rossi

EPICODE — Full Stack Web Development
