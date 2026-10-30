# Ceyteq API: build with the MySQL Prisma client used for TiDB.
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates git ffmpeg \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json tsup.config.ts runWithProvider.js prisma.config.ts ./
COPY src ./src
COPY config ./config
COPY prisma ./prisma
COPY public ./public
COPY Docker ./Docker
RUN DATABASE_PROVIDER=mysql DATABASE_CONNECTION_URI='mysql://user:pass@localhost:4000/ceyteq' npm run db:generate \
    && npm run build

FROM node:22-bookworm-slim AS runtime
LABEL org.opencontainers.image.title="Ceyteq API" \
      org.opencontainers.image.vendor="Ceyteq (Ceylon Technology)" \
      org.opencontainers.image.url="http://ceyteq.online/" \
      org.opencontainers.image.authors="info.ceyteq@gmail.com"
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates ffmpeg \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production DOCKER_ENV=true DATABASE_PROVIDER=mysql TZ=Asia/Colombo
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/Docker ./Docker
COPY --from=builder /app/runWithProvider.js /app/prisma.config.ts ./
# Prisma CLI scripts use the same alias mapping as the application.
COPY --from=builder /app/config ./config
EXPOSE 8080
ENTRYPOINT ["bash", "./Docker/scripts/entrypoint.sh"]
CMD ["node", "dist/main.js"]
