FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat git
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

CMD ["npm", "run", "start"]
