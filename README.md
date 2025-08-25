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

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (Resend) - for password reset
RESEND_API_KEY="your-resend-api-key"
```
