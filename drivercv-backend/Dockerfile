FROM node:18-alpine

WORKDIR /app

# Sadece dependency dosyalarını kopyala (cache layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Uygulama dosyalarını kopyala
COPY . .

# Uploads dizini (runtime)
RUN mkdir -p /app/uploads/runtime

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "server.js"]
