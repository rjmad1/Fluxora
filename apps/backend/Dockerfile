# --- Base Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy root configurations and lock files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install build dependencies
RUN npm ci

# Copy Prisma schema and generate client
COPY apps/backend/prisma ./apps/backend/prisma
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Copy source code and config files
COPY apps/backend ./apps/backend
COPY tsconfig.json ./

# Build NestJS application
RUN npm run build --workspace=apps/backend

# --- Production Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy root configuration and install only production dependencies
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci --only=production

# Copy generated Prisma Client and compiled code
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /usr/src/app/apps/backend/prisma ./apps/backend/prisma

# Expose backend REST API port
EXPOSE 3000

CMD ["node", "apps/backend/dist/main"]
