# Personal Library Manager

This open-source project provides a sleek and simple web app to manage personal libraries of physical books.

## Features

*   **Administrator Account**: Securely manage your library with an administrator account.
*   **Add Books**: Easily add books to your library using various methods:
    *   **Manual Input**: Enter book details manually.
    *   **ISBN Search**: Add books by searching for their ISBN.
    *   **Mobile Scanner**: Use your mobile device as a WebSocket-connected scanner to add books by scanning their ISBN.
*   **Collections**: Organize your books by adding them to a collection.
*   **Library Browser**: Browse your library with filtering and search functionality.
*   **Edit and Rate**: Edit book details, update cover images, and rate your books.

## Upcoming Features

We are continuously working to improve the app. Here are some of the features we plan to add next:

*   **Multiple Collections**: Allow a book to be part of multiple collections.
*   **Multiple Users**: Introduce support for multiple user accounts.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running with Docker

This is the recommended way to run the application in production.

### Prerequisites

*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Create an Environment File

Create a file named `.env` in the root of the project and add the following environment variables.

```env
# NextAuth - A secret key for signing tokens.
# Generate a random secret with: openssl rand -hex 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (Resend) - for password reset
RESEND_API_KEY="your-resend-api-key"
```

### 2. Build and Run the Application

Run the following command to build the Docker image and start the application:

```bash
docker-compose up --build -d
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Database Persistence

The SQLite database file is stored in the `data/` directory on your local machine. This directory is created automatically. You can back up this directory to save your library data.

### Stopping the Application

To stop the application, run:

```bash
docker-compose down
```

## Environment Variables (for local development)

If you are not using Docker, create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (Resend) - for password reset
RESEND_API_KEY="your-resend-api-key"
```
