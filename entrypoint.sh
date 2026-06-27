#!/bin/sh
set -e

PUID=${PUID:-1001}
PGID=${PGID:-1001}

echo "--- Configuring with PUID=$PUID PGID=$PGID ---"

# Remap the nextjs user/group to match the requested PUID/PGID
# This ensures the container user matches the host user for bind-mounted volumes
if [ "$(id -u nextjs 2>/dev/null)" != "$PUID" ] || [ "$(id -g nodejs 2>/dev/null)" != "$PGID" ]; then
  deluser nextjs 2>/dev/null || true
  delgroup nodejs 2>/dev/null || true
  addgroup -S -g "$PGID" nodejs
  adduser -S -u "$PUID" -G nodejs nextjs
  echo "Remapped nextjs to $PUID:$PGID"
fi

# Create covers directory if not present
mkdir -p /app/public/covers

# Try to set ownership on the covers directory so the nextjs user can write to it
# On some systems chown on a bind mount may fail (user namespaces, etc.),
# so fall back to making it world-writable.
if chown -R nextjs:nodejs /app/public/covers 2>/dev/null; then
  echo "Ownership of /app/public/covers set to nextjs:nodejs ($PUID:$PGID)"
else
  echo "Warning: Could not change ownership of /app/public/covers. Making world-writable..."
  chmod -R 777 /app/public/covers
fi

mkdir -p /prisma
if chown -R nextjs:nodejs /prisma 2>/dev/null; then
  echo "Ownership of /prisma set to nextjs:nodejs ($PUID:$PGID)"
else
  echo "Warning: Could not change ownership of /prisma. Making world-writable..."
  chmod -R 777 /prisma
fi

# Run database migrations
echo "Running database migrations..."
su-exec nextjs:nodejs npx prisma migrate deploy

# Drop privileges and start the application
echo "Starting the application..."
exec su-exec nextjs:nodejs "$@"
