FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001 4173

CMD ["sh", "-c", "npm run dev:server & npm run preview -- --host 0.0.0.0"]
