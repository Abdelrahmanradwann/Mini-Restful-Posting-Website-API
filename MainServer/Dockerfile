FROM node:latest

WORKDIR /app

# Copy package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install the app dependencies
# RUN npm install -g nodemon 
RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
