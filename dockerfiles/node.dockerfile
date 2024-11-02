FROM node:20-alpine

# 只需要安裝 bash
RUN apk add --no-cache bash

WORKDIR /app

COPY backend/package*.json ./
COPY backend/tsconfig.json ./

RUN npm install

COPY backend/ .

RUN ls -la
RUN cat tsconfig.json

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]