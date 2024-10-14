/* eslint-disable perfectionist/sort-objects */

import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { CommaSeparatedListOf } from "@pagopa/ts-commons/lib/comma-separated-list";
import { IntegerFromString } from "@pagopa/ts-commons/lib/numbers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { KafkaBaseConfig } from "../../../config";

export type KafkaProducerConfig = t.TypeOf<typeof KafkaProducerConfig>;
export const KafkaProducerConfig = t.intersection([
  t.intersection([
    t.type({
      brokers: t.union([
        t.array(t.string),
        t.Function,
        CommaSeparatedListOf(t.string),
      ]),
    }),
    t.partial({
      ssl: t.union([t.undefined, BooleanFromString]),
      sasl: t.union([
        t.undefined,
        t.intersection([
          t.type({ mechanism: t.literal("plain") }),
          t.type({ username: t.string, password: t.string }),
        ]),
        t.intersection([
          t.type({ mechanism: t.literal("scram-sha-256") }),
          t.type({ username: t.string, password: t.string }),
        ]),
        t.intersection([
          t.type({ mechanism: t.literal("scram-sha-512") }),
          t.type({ username: t.string, password: t.string }),
        ]),
        t.intersection([
          t.type({ mechanism: t.literal("aws") }),
          t.intersection([
            t.type({
              authorizationIdentity: t.string,
              accessKeyId: t.string,
              secretAccessKey: t.string,
            }),
            t.partial({ sessionToken: t.union([t.undefined, t.string]) }),
          ]),
        ]),
        t.intersection([
          t.type({ mechanism: t.literal("oauthbearer") }),
          t.type({ oauthBearerProvider: t.Function }),
        ]),
      ]),
      clientId: t.union([t.undefined, t.string]),
      connectionTimeout: t.union([t.undefined, IntegerFromString]),
      authenticationTimeout: t.union([t.undefined, IntegerFromString]),
      reauthenticationThreshold: t.union([t.undefined, IntegerFromString]),
      requestTimeout: t.union([t.undefined, IntegerFromString]),
      enforceRequestTimeout: t.union([t.undefined, BooleanFromString]),
      retry: t.union([
        t.undefined,
        t.partial({
          maxRetryTime: t.union([t.undefined, IntegerFromString]),
          initialRetryTime: t.union([t.undefined, IntegerFromString]),
          factor: t.union([t.undefined, IntegerFromString]),
          multiplier: t.union([t.undefined, IntegerFromString]),
          retries: t.union([t.undefined, IntegerFromString]),
        }),
      ]),
      socketFactory: t.union([t.undefined, t.Function]),
      logCreator: t.union([t.undefined, t.Function]),
    }),
  ]),
  t.partial({
    createPartitioner: t.union([t.undefined, t.Function]),
    retry: t.union([
      t.undefined,
      t.partial({
        maxRetryTime: t.union([t.undefined, IntegerFromString]),
        initialRetryTime: t.union([t.undefined, IntegerFromString]),
        factor: t.union([t.undefined, IntegerFromString]),
        multiplier: t.union([t.undefined, IntegerFromString]),
        retries: t.union([t.undefined, IntegerFromString]),
      }),
    ]),
    metadataMaxAge: t.union([t.undefined, IntegerFromString]),
    allowAutoTopicCreation: t.union([t.undefined, BooleanFromString]),
    idempotent: t.union([t.undefined, BooleanFromString]),
    transactionalId: t.union([t.undefined, t.string]),
    transactionTimeout: t.union([t.undefined, IntegerFromString]),
    maxInFlightRequests: t.union([t.undefined, IntegerFromString]),
  }),
]);

export const getKafkaProduceConfigForTopic = (
  kafkaBaseConfig: KafkaBaseConfig,
  eventHubConnectionString: NonEmptyString,
): KafkaProducerConfig =>
  pipe(
    {
      brokers: [kafkaBaseConfig.KAFKA_BROKER],
      clientId: kafkaBaseConfig.KAFKA_CLIENT_ID,
      ssl: kafkaBaseConfig.KAFKA_SSL,
      sasl: {
        mechanism: kafkaBaseConfig.KAFKA_SASL_MECHANISM,
        username: kafkaBaseConfig.KAFKA_SASL_USERNAME,
        password: eventHubConnectionString,
      },
      idempotent: kafkaBaseConfig.KAFKA_IDEMPOTENT,
      maxInFlightRequests: kafkaBaseConfig.KAFKA_MAX_INFLIGHT_REQUESTS,
      transactionalId: kafkaBaseConfig.KAFKA_TRANSACTIONAL_ID,
    },
    KafkaProducerConfig.decode,
    E.getOrElseW((errors) => {
      throw new Error(`Invalid Kafka configuration: ${readableReport(errors)}`);
    }),
  );
