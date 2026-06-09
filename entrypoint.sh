#!/bin/sh
set -e

# Create covers directory if not present and set ownership
mkdir -p /app/public/covers
chown -R nextjs:nodejs /app/public/covers

# Run database migrations
echo "Running database migrations..."
su-exec nextjs:nodejs npx prisma migrate deploy

# Drop privileges and start the application
echo "Starting the application..."
exec su-exec nextjs:nodejs "$@"
