# Mission Control Production Dockerfile

# Use official Node.js LTS image
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S missioncontrol -u 1001

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Build stage
FROM base AS builder

# Install all dependencies (including dev dependencies)
RUN npm ci
RUN cd server && npm ci

# Copy source code
COPY . .

# Remove development dependencies and clean cache
RUN npm prune --production && \
    cd server && npm prune --production && \
    npm cache clean --force

# Production stage
FROM base AS production

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy application code
COPY --from=builder --chown=missioncontrol:nodejs /app .

# Switch to non-root user
USER missioncontrol

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "server/server.js"]