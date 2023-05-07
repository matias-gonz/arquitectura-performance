FROM node:18
RUN mkdir /opt/app
WORKDIR /opt/app
COPY . .
RUN npm install
CMD ["npm", "run", "dev"]
