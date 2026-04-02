FROM public.ecr.aws/docker/library/node:20-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c AS builder

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
FROM mcr.microsoft.com/azure-functions/node:4-node20@sha256:c9d45dd9ad3c49113a6a226d91df187a64708a63c2e60756cf7e7c12207486b3 AS runtime

ENV AzureWebJobsScriptRoot=/home/site/apps/app-backend \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY --from=builder /workspace/out/ /home/site/

WORKDIR /home/site/apps/app-backend

EXPOSE 80
