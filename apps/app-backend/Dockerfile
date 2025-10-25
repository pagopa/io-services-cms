FROM public.ecr.aws/docker/library/node:20-alpine@sha256:6178e78b972f79c335df281f4b7674a2d85071aae2af020ffa39f0a770265435 AS builder

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
FROM mcr.microsoft.com/azure-functions/node:4-node20@sha256:2d14c69b3962e51bba0bf58f4294d7b8fe820ecfb92ade3d74d8f8b91727d029 AS runtime

ENV AzureWebJobsScriptRoot=/home/site/apps/app-backend \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY --from=builder /workspace/out/ /home/site/

WORKDIR /home/site/apps/app-backend

EXPOSE 80
