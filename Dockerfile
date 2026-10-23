# Imagem de produção do DevTrack.
# Build multi-estágio: compila a interface e a API, depois roda apenas a API
# servindo a interface já compilada.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm install

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
EXPOSE 3333
CMD ["node", "server/dist/index.js"]
