# io-services-cms-webapp

---

## Usage

- create a `.env` file with the actual environment configuration
- `yarn start`
- the application is listening on port `7071`

## Configuration

Please refer to `src/config.ts` for the actually needed configuration.

## Postgres DB Migration

### Prerequisites

- An instance of Docker installed and running

### How to run migration by getting most of the required parameters from Azure

> **Note**
>
> In order to execute correctly the script, you need to complete the following steps:
>
> - Access to io-p-vnet-common VPN
> - Login to Azure using CLI (az login)

From the project root, move into `db/` folder and run `./scripts/run_flyway_on_azure.sh` with the proper parameters (open script code to see usage documentation).

`run_flyway_on_azure.sh` usage example:

```
./scripts/run_flyway_on_azure.sh migrate reviewer PROD-IO schema/migrations reviewerusr
```

### How to run migration by passing all required parameters explicitly

> **Note**
>
> In order to execute correctly the script, you need to have access to Postgres server

From the project root, move into `db/` folder and run `./scripts/run_flyway_on_server.sh` with the proper parameters (open script code to see usage documentation).

`run_flyway_on_server.sh` usage example:

```
./scripts/run_flyway_on_server.sh migrate reviewer localhost 5432 AdminUser AdminPassword reviewerusr UsrPassword schema/migrations
```
