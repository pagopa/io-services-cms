FROM public.ecr.aws/docker/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS builder

COPY . /workspace

WORKDIR /workspace

RUN corepack enable

RUN pnpm config set nodeLinker node-modules
RUN pnpm config set nmHoistingLimits workspaces
RUN pnpm workspaces focus

RUN pnpm dlx turbo prune io-services-app-backend

COPY tsconfig.json out/

WORKDIR /workspace/out

# TODO: add --immutable
RUN pnpm install
RUN pnpm dlx turbo build --filter io-services-app-backend
RUN pnpm workspaces focus io-services-app-backend --production

# To enable ssh & remote debugging on app service change the base image to the one below
# FROM mcr.microsoft.com/azure-functions/node:4-node20-appservice
FROM mcr.microsoft.com/azure-functions/node:4-node20@sha256:75bd0b59912a5edd4b3ad62dc5f36219909ab1442a32686fe9dc8773c25eee87 AS runtime

ENV AzureWebJobsScriptRoot=/home/site/apps/app-backend \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY --from=builder /workspace/out/ /home/site/

WORKDIR /home/site/apps/app-backend

EXPOSE 80
