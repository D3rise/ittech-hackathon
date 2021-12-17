FROM node:17.2.0-alpine
RUN npm install -g pnpm

WORKDIR /app

COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml

RUN pnpm install
COPY tsconfig.json tsconfig.json
COPY src src

RUN pnpm preprod
CMD ["pnpm", "prod"]