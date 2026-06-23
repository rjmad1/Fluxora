# --- Base Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy root configurations and lock files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/

# Install build dependencies
RUN npm ci

# Copy source code and config files
COPY apps/frontend ./apps/frontend
COPY tsconfig.json ./

# Build Next.js application
RUN npm run build --workspace=apps/frontend

# --- Production Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3001

# Copy root configuration and install only production dependencies
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
RUN npm ci --only=production

# Copy compiled Next.js bundle and static assets
COPY --from=builder /usr/src/app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /usr/src/app/apps/frontend/public ./usr/src/app/apps/frontend/public

# Expose Next.js port
EXPOSE 3001

# Start Next.js server on designated port
CMD ["npm", "run", "start", "--workspace=apps/frontend", "--", "-p", "3001"]
