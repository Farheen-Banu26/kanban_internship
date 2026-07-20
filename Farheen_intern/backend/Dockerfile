# Backend Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY . .

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=base /app .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/server.js"]
