FROM public.ecr.aws/docker/library/node:20-alpine@sha256:1ab6fc5a31d515dc7b6b25f6acfda2001821f2c2400252b6cb61044bd9f9ad48 AS builder

COPY . /workspace

WORKDIR /workspace

RUN corepack enable

RUN yarn config set nodeLinker node-modules
RUN yarn config set nmHoistingLimits workspaces
RUN yarn workspaces focus

RUN npx turbo prune io-services-app-backend

COPY tsconfig.json out/

WORKDIR /workspace/out

# TODO: add --immutable
RUN yarn install
RUN npx turbo build --filter io-services-app-backend
RUN yarn workspaces focus io-services-app-backend --production

# To enable ssh & remote debugging on app service change the base image to the one below
# FROM mcr.microsoft.com/azure-functions/node:4-node20-appservice
FROM mcr.microsoft.com/azure-functions/node:4-node20@sha256:d135c6ebc7d855c92b42f76b31529127964b3eca10c16331356977ecdc8be871 AS runtime

ENV AzureWebJobsScriptRoot=/home/site/apps/app-backend \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY --from=builder /workspace/out/ /home/site/

WORKDIR /home/site/apps/app-backend

EXPOSE 80
