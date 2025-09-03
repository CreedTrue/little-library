#!/bin/sh

# This script is the entrypoint for the Docker container.
# It runs database migrations and then starts the application.

# Exit immediately if a command exits with a non-zero status.
set -e

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application by executing the command given as arguments to this script.
echo "Starting the application..."
exec "$@"
