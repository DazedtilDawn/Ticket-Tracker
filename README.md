# Ticket Tracker

A web application for tracking tickets. This project uses Node.js, Express, React and Vite.

## Prerequisites

- **Node.js 20 or higher**
- **npm** (comes with Node.js)
- **Bun** (optional, used for running tests)

Set the following environment variables before starting the server:

- `DATABASE_URL` – connection string for your PostgreSQL database
- `JWT_SECRET` – secret string for signing JSON Web Tokens

## Installation

Install dependencies:

```bash
npm install
```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

## Production

Create a production build:

```bash
npm run build
```

Run the built application:

```bash
npm start
```

## Running Tests

Tests are written with Bun. Run them with:

```bash
bun test
```

(You can also run `npm test` if Bun is installed globally.)

## Docker

A `Dockerfile` is provided to build and run the application in a container.
Use it to containerize the project for production deployments.

