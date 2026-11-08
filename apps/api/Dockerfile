# Build context is the REPO ROOT (the API bundles workspace packages):
#   docker build -f apps/api/Dockerfile -t podmates-api .
# Any container host can run this image.

# Override if Docker Hub rate-limits you: --build-arg NODE_IMAGE=mirror.gcr.io/library/node:22-alpine
ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /repo
# Manifests first for layer caching. Every workspace manifest is needed for `npm ci` to validate the lockfile.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
COPY packages/shared/package.json packages/shared/
COPY packages/tree-engine/package.json packages/tree-engine/
COPY packages/db/package.json packages/db/
COPY packages/ui-tokens/package.json packages/ui-tokens/
RUN npm ci --workspace @podmates/api --include-workspace-root=false --ignore-scripts
COPY tsconfig.base.json ./
COPY packages packages
COPY apps/api apps/api
RUN npm run build -w @podmates/api

FROM ${NODE_IMAGE} AS deps
WORKDIR /repo
COPY --from=build /repo/package.json /repo/package-lock.json ./
COPY --from=build /repo/apps/api/package.json apps/api/
COPY --from=build /repo/apps/mobile/package.json apps/mobile/
COPY --from=build /repo/packages packages
RUN npm ci --workspace @podmates/api --include-workspace-root=false --omit=dev --ignore-scripts

FROM ${NODE_IMAGE}
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=deps /repo/node_modules node_modules
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY --from=build /repo/apps/api/package.json apps/api/
USER node
EXPOSE 4100
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:${PORT:-4100}/health || exit 1
CMD ["node", "apps/api/dist/index.js"]
