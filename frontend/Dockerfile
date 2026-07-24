FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 8080

CMD ["yarn", "dev", "--hostname", "0.0.0.0", "--port", "8080"]
