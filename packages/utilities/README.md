# @io-services-cms/utilities

A collection of utility scripts for io-services-cms maintenance tasks.

## Setup

Copy the example env file and fill in the values:

```sh
cp env.example .env
```

| Variable                         | Description                        |
| -------------------------------- | ---------------------------------- |
| `AZURE_APIM`                     | Azure API Management instance name |
| `AZURE_APIM_PRODUCT_NAME`        | APIM product name                  |
| `AZURE_APIM_RESOURCE_GROUP`      | Azure resource group name          |
| `AZURE_SUBSCRIPTION_ID`          | Azure subscription ID              |
| `SELFCARE_API_KEY`               | Selfcare API key                   |
| `SELFCARE_EXTERNAL_API_BASE_URL` | Selfcare external API base URL     |

## Build

From the repo root, build only this package:

```sh
pnpm install --frozen-lockfile && pnpm --filter @io-services-cms/utilities build
```

## Scripts

### purge-all-aggregates

Purges all aggregates for an aggregator via APIM and Selfcare APIs.

```sh
pnpm --filter @io-services-cms/utilities purge-all-aggregates --aggregatorInstitutionId <AGGREGATOR_ID>
```

> **Note:** The script reads configuration from the `.env` file using Node's `--env-file` flag, so make sure it is populated before running.
