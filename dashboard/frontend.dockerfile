FROM node:22.16-alpine AS build

ARG VITE_EXPRESS_API_URL
ENV VITE_EXPRESS_API_URL=$VITE_EXPRESS_API_URL

WORKDIR /build
COPY package*.json ./

RUN npm install
COPY . .

RUN npm run build-frontend

FROM nginx:1.28-alpine

COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
