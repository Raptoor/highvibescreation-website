FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json ./
RUN npm install --omit=dev
COPY server.cjs ./
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "server.cjs"]
