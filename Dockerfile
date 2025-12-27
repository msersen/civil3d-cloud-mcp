# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["node", "build/index.js"]
