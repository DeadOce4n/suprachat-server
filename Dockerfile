FROM node:18-slim

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY . /home/node/app/

RUN corepack enable
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild
RUN pnpm prune --prod --config.ignore-scripts=true
RUN npm install -g tsx

EXPOSE 3000

CMD ["pnpm", "start"]
