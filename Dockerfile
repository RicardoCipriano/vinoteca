FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node","server/server.js"]