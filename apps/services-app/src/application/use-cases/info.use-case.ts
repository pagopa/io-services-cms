import type { UseCase } from "@pagopa/io-core-domain";

import { ok } from "neverthrow";

interface InfoOutput {
  readonly name: string;
  readonly ok: boolean;
  readonly version: string;
}

export const getInfoUseCase: UseCase<
  Record<string, never>,
  InfoOutput,
  never
> = async () =>
  ok({
    name: "io-example-fastify",
    ok: true,
    version: "0.0.1",
  });
