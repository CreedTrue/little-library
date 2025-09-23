# Contributing to Personal Library Manager

We welcome contributions from the community! Whether you're fixing a bug, adding a new feature, or improving documentation, your help is appreciated.

## Getting Started

If you want to run the project locally for development, you can follow these steps.

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

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

### Environment Variables

For local development, you'll need to create a `.env` file in the root of the project. You can copy the example below:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth - A secret key for signing tokens.
# Generate a random secret with: openssl rand -hex 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (Resend) - for password reset
RESEND_API_KEY="your-resend-api-key"
```

## Contribution Process

We follow a standard pull request workflow for contributions.

1.  **Fork the repository** and clone it to your local machine.
2.  **Create a new branch** for your changes. All contributions should work off of the `staging` branch and should merge into it as well, unless otherwise organized through the repo manager.
3.  **Make your changes** and commit them with a clear and descriptive commit message.
4.  **Push your changes** to your forked repository.
5.  **Create a pull request** from your branch to the `staging` branch of the main repository.
6.  **Wait for a review.** One of the project maintainers will review your pull request and may suggest some changes.
7.  Once your pull request is approved, it will be **merged into the `staging` branch.**

Thank you for your interest in contributing to the project!
