FROM node:17.8.0-alpine3.15

WORKDIR /home/node
COPY . .

RUN npm install
RUN npm install @grpc/grpc-js

CMD [ "npm", "start" ]