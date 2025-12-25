FROM public.ecr.aws/docker/library/node:20-alpine@sha256:658d0f63e501824d6c23e06d4bb95c71e7d704537c9d9272f488ac03a370d448 AS builder

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
FROM mcr.microsoft.com/azure-functions/node:4-node20@sha256:81c579debf2f953ab90d3573f35bf1557ed818f50c9610acd64a1dc29fb967b4 AS runtime

ENV AzureWebJobsScriptRoot=/home/site/apps/app-backend \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY --from=builder /workspace/out/ /home/site/

WORKDIR /home/site/apps/app-backend

EXPOSE 80
