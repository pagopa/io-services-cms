import { Container } from "@azure/cosmos";
import { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import { Result, ResultAsync, err, ok } from "neverthrow";
import { ZodType } from "zod";

/**
 * Reads and validates a service document from a Cosmos DB container.
 *
 * @param options - The container, entity metadata, validation schema, and service ID.
 * @returns The validated Cosmos DB document or the corresponding application error.
 */
export const readCosmosService = async <T extends object>({
  container,
  entityName,
  schema,
  serviceId,
}: {
  container: Container;
  entityName: string;
  schema: ZodType<T>;
  serviceId: string;
}): Promise<Result<T, GenericError | NotFoundError>> => {
  // 1. Eseguiamo la chiamata. Se la Promise fallisce (es. timeout, no network),
  // catturiamo direttamente tutto in un GenericError. Il 404 NON passerà di qua.
  const cosmosResponse = await ResultAsync.fromPromise(
    container.item(serviceId, serviceId).read<Record<string, unknown>>(),
    (error) =>
      new GenericError(
        `Unable to read ${entityName} '${serviceId}' from Cosmos: ${error}`,
      ),
  );

  if (cosmosResponse.isErr()) {
    return err(cosmosResponse.error);
  }

  const response = cosmosResponse.value;

  // 2. Gestiamo il 404 ispezionando lo statusCode della risposta risolta
  if (response.statusCode === 404 || response.resource === undefined) {
    return err(new NotFoundError(entityName, serviceId));
  }

  // 3. Intercettiamo eventuali altri status code anomali (es. 304 Not Modified se si usano gli ETag)
  if (response.statusCode !== 200) {
    return err(
      new GenericError(
        `Unexpected Cosmos response for ${entityName} '${serviceId}': ${response.statusCode}`,
      ),
    );
  }

  // 4. Validazione Zod del payload
  const parsedService = schema.safeParse(response.resource);

  if (!parsedService.success) {
    return err(
      new GenericError(
        `Invalid ${entityName} document: ${parsedService.error.message}`,
      ),
    );
  }

  return ok(parsedService.data);
};
