FROM node:22.16-alpine

WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .
RUN npm run build-backend

EXPOSE 3000
CMD ["npm", "run", "start"]
