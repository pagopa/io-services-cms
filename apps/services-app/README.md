# services-app

## Local development

The root Compose stack provides the minimum local dependencies: Azure Cosmos DB
Emulator and PostgreSQL. Cosmos databases and containers are initialized by the
emulator, while Flyway applies the existing reviewer database migrations.

On the first Cosmos startup, the emulator runs
`docker/cosmos-init/01-create-services.csh` and creates `db-services-cms` with
the `services-lifecycle` and `services-publication` containers. The
`postgres-migrations` service applies all migrations from
`apps/io-services-cms-webapp/db/schema/migrations/reviewer`. Both initialization
steps are safe to run again against existing local data.

Start the dependencies and run the application on the host:

```sh
docker compose up -d --wait cosmosdb postgres
docker compose run --rm postgres-migrations
pnpm --filter services-app dev:local
```

The tracked `.env.local` points the application at the exposed localhost ports.
Personal `.env` files are not used by this command. Azure Monitor is disabled
outside production, so local telemetry is not sent to Application Insights.
Compose uses `local` for all PostgreSQL passwords by default. Set
`LOCAL_POSTGRES_ADMIN_PASSWORD`, `LOCAL_POSTGRES_APP_PASSWORD`, and
`LOCAL_POSTGRES_READONLY_PASSWORD` before starting Compose to override them.

Run the application and its dependencies entirely in Docker:

```sh
docker compose --profile app up --build
```

The application is available at `http://localhost:3000`. Its liveness endpoint
is `/api/info`, and its dependency-aware readiness endpoint is `/api/health`.
Verify that the application started and can reach both databases with:

```sh
curl --fail http://localhost:3000/api/info
curl --fail http://localhost:3000/api/health
```

The readiness response is successful when it returns `{"failures":[]}`.

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

Remove local database data and repeat the complete initialization from an empty
state with:

```sh
docker compose down --volumes
docker compose up -d --wait cosmosdb postgres
docker compose run --rm postgres-migrations
```
