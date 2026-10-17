FROM scratch AS npm-cache

FROM node:24-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=build_ca --mount=from=npm-cache,target=/opt/npm-cache \
    if [ -f /run/secrets/build_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca; fi; \
    if [ -d /opt/npm-cache/_cacache ]; then \
      mkdir -p /root/.npm && cp -a /opt/npm-cache/_cacache /root/.npm/ && npm ci --offline; \
    else npm ci --fetch-retries=1 --fetch-timeout=30000; fi
COPY . .
RUN npm run build && npm test

FROM node:24-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5 AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=10000 DATABASE_PATH=/var/data/commerce.sqlite
RUN mkdir -p /var/data && chown node:node /var/data
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/package.json ./package.json
EXPOSE 10000
CMD ["node", "--use-env-proxy", "server/run.mjs"]
