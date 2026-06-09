FROM node:20-alpine

ENV NODE_ENV=production
ENV AUTH_LOG_DIR=/app/logs
ENV DATA_DIR=/app/data
WORKDIR /app

# Install production dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Writable dirs for logs/data, owned by the non-root node user
RUN mkdir -p /app/logs /app/data && chown -R node:node /app
USER node

EXPOSE 5001

# Health check hits the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5001/health || exit 1

CMD ["node", "server.js"]
