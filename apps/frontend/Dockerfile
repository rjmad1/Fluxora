# --- Base Build Stage ---
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copy root configurations (excluding lock files to prevent native binary issues)
COPY package.json ./
COPY apps/frontend/package.json ./apps/frontend/

# Install build dependencies
RUN npm install --legacy-peer-deps

# Copy source code and config files
COPY apps/frontend ./apps/frontend

# Build Next.js application
RUN npm run build --workspace=apps/frontend

# --- Production Runner Stage ---
FROM node:20-slim AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3001

# Copy root configuration (excluding lock files)
COPY package.json ./
COPY apps/frontend/package.json ./apps/frontend/
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled Next.js bundle and static assets
COPY --from=builder /usr/src/app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /usr/src/app/apps/frontend/public ./usr/src/app/apps/frontend/public

# Expose Next.js port
EXPOSE 3001

# Start Next.js server on designated port
CMD ["npm", "run", "start", "--workspace=apps/frontend", "--", "-p", "3001"]
