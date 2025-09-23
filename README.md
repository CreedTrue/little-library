# Personal Library Manager

This open-source project provides a sleek and simple web app for easily hosting and maintaining personal libraries of physical books.

This project was inspired by book lovers who also love to share their passion for books with others. Originally, it was created to manage a 5th-grade teacher's books in her classroom and home, but it has taken on a larger goal to eventually be a simple yet extensible tool for all book lovers.

## Features

*   **Administrator Account**: Securely manage your library with an administrator account.
*   **Add Books**: Easily add books to your library using various methods:
    *   **Manual Input**: Enter book details manually.
    *   **ISBN Search**: Add books by searching for their ISBN.
    *   **Mobile Scanner**: Use your mobile device as a WebSocket-connected scanner to add books by scanning their ISBN.
*   **Collections**: Organize your books by adding them to a collection.
*   **Library Browser**: Browse your library with filtering and search functionality.
*   **Edit and Rate**: Edit book details, update cover images, and rate your books.

## Getting Started with Docker

This is the recommended way to run the application.

### Prerequisites

*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/)

### Step 1: Create an Environment File

Before you can run the application, you need to create a `.env` file in the same folder as the `docker-compose.yml` file. This file will store your environment variables.

Create a file named `.env` and add the following content:

```env
# NextAuth - A secret key for signing tokens.
# You can generate a random secret with the command: openssl rand -hex 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Email (Resend) - for password reset
# This is optional and only needed if you want to use the password reset feature.
RESEND_API_KEY="your-resend-api-key"
```

### Step 2: Run the Application

With Docker running, execute the following command in your terminal:

```bash
docker-compose up --build -d
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Database Persistence

By default, the SQLite database file is stored in a `data` directory that is automatically created in the project's root folder.

If you want to store the database in a different location on your computer, you can edit the `docker-compose.yml` file. Change the following line:

```yml
volumes:
  - ./data:/prisma
```

Replace `./data` with the absolute or relative path to your desired directory. For example, to store it in a folder named `my-library-data` in your home directory, you would use:

```yml
# Example for Linux or macOS
volumes:
  - ~/my-library-data:/prisma

# Example for Windows
volumes:
  - C:/Users/YourUser/my-library-data:/prisma
```

### Stopping the Application

To stop the application, run:

```bash
docker-compose down
```

## Contributing

We welcome contributions! If you're interested in contributing to the project, please see our [Contributing Guide](CONTRIBUTING.md) for more information on how to get started.
