FROM node:22.16-alpine

WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .
RUN npm run build-backend

EXPOSE 8080
CMD ["node", "dist-server/server.js"]
