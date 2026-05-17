FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/types/package*.json ./packages/types/
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build --workspace=apps/backend

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json

EXPOSE 5000

CMD ["node", "apps/backend/dist/apps/backend/src/server.js"]
