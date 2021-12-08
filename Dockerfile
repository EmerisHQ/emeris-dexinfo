FROM node:16 AS build-env

WORKDIR /app
COPY package*.json /app
RUN npm install
COPY . /app

RUN npm run build

FROM gcr.io/distroless/nodejs:16
COPY --from=build-env /app /app
WORKDIR /app
EXPOSE 8080
CMD ["dist/index.js"]