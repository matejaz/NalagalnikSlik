# Backend Dockerfile
FROM node:20-alpine3.19

# Update system packages to address vulnerabilities
RUN apk update && apk upgrade

# Set working directory
WORKDIR /app

# Install system dependencies needed for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    && ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy Prisma schema first (for generation)
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy application source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Build TypeScript
RUN npm run build || echo "No build script found, using ts-node"

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
