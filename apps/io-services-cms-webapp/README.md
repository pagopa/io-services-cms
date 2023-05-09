# io-services-cms-webapp

----

## Usage
* create a `.env` file with the actual environment configuration
* `yarn start`
* the application is listening on port `7071`

## Configuration
Please refer to `src/config.ts` for the actually needed configuration.

## Postgres DB Migration
Move into `reviewer/` folder and run `./scripts/run_flyway_on_<azure|server>.sh` with the proper parameters (open script code to see usage documentation).

`run_flyway_on_azure.sh` usage example:
```
./scripts/run_flyway_on_azure.sh migrate reviewer PROD-IO schema/migrations reviewer reviewerusr
```

`run_flyway_on_server.sh` usage example:
```
./scripts/run_flyway_on_server.sh migrate reviewer localhost 5432 AdminUser AdminPassword reviewerusr UsrPassword schema/migrations reviewer
```
