FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npx tsc

EXPOSE 5173

CMD ["node", "dist/server.js"]
