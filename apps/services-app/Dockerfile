# syntax=docker/dockerfile:1

FROM public.ecr.aws/docker/library/node:24.16.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .

RUN npx turbo@2.5.0 prune services-app --docker

FROM base AS builder

COPY --from=pruner /repo/out/json/ ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile

COPY --from=pruner /repo/out/full/ ./
RUN pnpm --filter services-app... build

RUN pnpm --filter services-app --prod deploy --legacy /repo/deploy

FROM public.ecr.aws/docker/library/node:24.16.0-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
WORKDIR /app

COPY --chown=node:node --from=builder /repo/deploy/node_modules ./node_modules
COPY --chown=node:node --from=builder /repo/deploy/dist ./dist
COPY --chown=node:node --from=builder /repo/deploy/package.json ./package.json

USER node
EXPOSE 3000

CMD ["node", "dist/main.js"]
