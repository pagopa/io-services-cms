FROM public.ecr.aws/docker/library/node:20-alpine@sha256:dbbdff86c3723055de6021bbc3de6934e3795563e56245fb1e83b6485dbe4a8c AS builder

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
FROM mcr.microsoft.com/azure-functions/node:4-node20@sha256:2870cc6ed9d5c33e64d98807cc76993f16fc3f4054033a5ef641bd64784476e8 AS runtime

ENV AzureWebJobsScriptRoot=/home/site/apps/app-backend \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY --from=builder /workspace/out/ /home/site/

WORKDIR /home/site/apps/app-backend

EXPOSE 80
