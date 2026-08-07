# services-app

## Local development

The root Compose stack provides the minimum local dependencies: Azure Cosmos DB
Emulator and PostgreSQL. Cosmos databases and containers are initialized by the
emulator, while Flyway applies the existing reviewer database migrations.

Start the dependencies and run the application on the host:

```sh
docker compose up -d --wait cosmosdb postgres
docker compose run --rm postgres-migrations
pnpm --filter services-app dev:local
```

The tracked `.env.local` points the application at the exposed localhost ports.
Personal `.env` files are not used by this command. Azure Monitor is disabled
outside production, so local telemetry is not sent to Application Insights.

Run the application and its dependencies entirely in Docker:

```sh
docker compose --profile app up --build
```

The application is available at `http://localhost:3000`. Its liveness endpoint
is `/api/info`, and its dependency-aware readiness endpoint is `/api/health`.

The VS Code devcontainer uses the same root stack through a small Compose
overlay. From its terminal, run the standard development command because the
container already exposes the Docker-network configuration:

```sh
pnpm --filter services-app dev
```

Additional Azurite, Event Hubs emulator, and Kafka UI services used by the
legacy CMS can be started independently:

```sh
docker compose --profile cms up -d azurite azurite-setup eventhubs kafka-ui
```

Remove local database data and force initialization to run again with:

```sh
docker compose down --volumes
```
