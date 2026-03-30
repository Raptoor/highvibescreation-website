# ── mail-api — formular contact / newsletter (Node + SMTP)
# Coolify: fie build din folder mail-api/ cu acest Dockerfile,
# fie folosește compose.yaml din rădăcină (include acest build).
#
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json ./
RUN npm install --omit=dev
COPY server.cjs ./
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -sf http://127.0.0.1:3000/health || exit 1
CMD ["node", "server.cjs"]
