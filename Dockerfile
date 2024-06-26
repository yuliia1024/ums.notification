FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /usr/src/app

RUN npm install -g @nestjs/cli

COPY package.json ./

RUN npm install

COPY . .

ARG PORT=8000
ENV PORT=$PORT
EXPOSE $PORT

RUN npm run build

CMD ["node", "dist/main.js"]
