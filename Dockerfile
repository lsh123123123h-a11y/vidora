FROM node:24-bookworm-slim AS base
WORKDIR /workspace
RUN corepack enable && corepack prepare yarn@1.22.22 --activate \
    && yarn config set registry https://registry.npmmirror.com/

FROM base AS web-builder
COPY apps/web/package.json apps/web/yarn.lock ./apps/web/
RUN cd apps/web && yarn install --frozen-lockfile --non-interactive
COPY apps/web ./apps/web
RUN cd apps/web && NODE_OPTIONS=--max-old-space-size=4096 yarn build-only

FROM base AS api-builder
COPY apps/api/package.json apps/api/yarn.lock ./apps/api/
RUN cd apps/api && yarn install --frozen-lockfile --non-interactive
COPY apps/api ./apps/api
RUN cd apps/api && yarn build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=prod \
    HOST=0.0.0.0 \
    PORT=10588 \
    VIDORA_DATA_DIR=/app/data \
    VIDORA_WEB_DIR=/app/public

COPY --from=api-builder /workspace/apps/api/node_modules ./node_modules
COPY --from=api-builder /workspace/apps/api/data ./default-data
COPY --from=api-builder /workspace/apps/api/data/serve/app.js ./serve/app.js
COPY --from=web-builder /workspace/apps/web/dist ./public
COPY scripts/docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p /app/data /app/public \
    && chmod +x /app/docker-entrypoint.sh

EXPOSE 10588
VOLUME ["/app/data"]
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "/app/serve/app.js"]
