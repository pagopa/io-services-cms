import type {
  InputValidator,
  OutputFormatter,
  UseCase,
} from "@pagopa/io-core-domain";

import { BaseError } from "@pagopa/io-core-domain/errors";
import { FastifyReply, FastifyRequest } from "fastify";

import { sendErrorResponse } from "./errorMapper.js";

export const createHttpHandler =
  <TUseCaseInput extends object, O, E extends BaseError, R>(
    useCase: UseCase<TUseCaseInput, O, E>,
    inputValidator: InputValidator<FastifyRequest, TUseCaseInput>,
    outputFormatter: OutputFormatter<O, R>,
    options: {
      successCode: 200 | 201 | 202 | 204;
    } = { successCode: 200 },
  ) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Validate input using the provided input validator
    const inputResult = await inputValidator(request);

    if (inputResult.isErr()) {
      return sendErrorResponse(reply, inputResult.error);
    }

    // Call the use case with the validated input
    const result = await useCase(inputResult.value);

    // Handle the result of the use case
    if (result.isErr()) {
      return sendErrorResponse(reply, result.error);
    }

    // Format the output using the provided output formatter
    const formatted = await outputFormatter(result.value);

    if (formatted.isErr()) {
      return sendErrorResponse(reply, formatted.error);
    }

    // TODO: Add support for security headers and other common response headers
    return reply.code(options.successCode).send(formatted.value);
  };
