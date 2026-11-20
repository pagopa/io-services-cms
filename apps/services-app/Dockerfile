# syntax=docker/dockerfile:1@sha256:4edf897a3ffa55b89f906fc8cc78afdb3f1834cc9c7083565e611a8a7d5fe99e

FROM public.ecr.aws/docker/library/node:24.22.1-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS base
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

FROM public.ecr.aws/docker/library/node:24.22.1-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS runtime
WORKDIR /app

COPY --chown=node:node --from=builder /repo/deploy/node_modules ./node_modules
COPY --chown=node:node --from=builder /repo/deploy/dist ./dist
COPY --chown=node:node --from=builder /repo/deploy/package.json ./package.json

USER node
EXPOSE 3000

CMD ["npm", "start"]
