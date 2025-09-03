# Stage 1: Builder
# This stage installs all dependencies, including dev dependencies,
# and builds the application.
FROM node:20-alpine AS builder
WORKDIR /app

# Install all dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Generate the Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Stage 2: Production
# This stage creates the final, lean production image.
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the entrypoint script and set proper ownership
COPY --chown=nextjs:nodejs entrypoint.sh .
# Convert line endings to Unix format and make executable
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

# Copy only necessary files from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/prisma ./prisma

# The server.js file requires socket.cjs from the lib directory
COPY --from=builder --chown=nextjs:nodejs /app/lib/socket.cjs ./lib/socket.cjs

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the entrypoint script
ENTRYPOINT ["./entrypoint.sh"]

# The command to run the application, which will be passed to the entrypoint script
CMD ["node", "server.js"]
