FROM node:latest

WORKDIR /app

RUN mkdir -p /tmp

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm","run", "start"]