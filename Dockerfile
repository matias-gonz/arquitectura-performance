FROM node:18
RUN mkdir /opt/app
WORKDIR /opt/app
COPY package.json app/app.js package-lock.json ./
RUN npm install
ENTRYPOINT ["node", "app.js"]
