FROM public.ecr.aws/docker/library/node:20-alpine@sha256:09e2b3d9726018aecf269bd35325f46bf75046a643a66d28360ec71132750ec8 AS builder

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
FROM mcr.microsoft.com/azure-functions/node:4-node20@sha256:75748d40174316092ede2ce892753e23dd486ed953edb2b29dfaa1b0774fac80 AS runtime

ENV AzureWebJobsScriptRoot=/home/site/apps/app-backend \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY --from=builder /workspace/out/ /home/site/

WORKDIR /home/site/apps/app-backend

EXPOSE 80
