FROM node:25.1 AS tg_mini_app
WORKDIR /app

ARG VITE_CRUD_API_URL
ENV VITE_CRUD_API_URL=$VITE_CRUD_API_URL

COPY package*.json .
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.29.8-alpine

COPY --from=tg_mini_app /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
