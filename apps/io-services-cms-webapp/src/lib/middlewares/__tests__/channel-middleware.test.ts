import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { ChannelMiddleware } from "../channel-middleware";

const makeRequest = (value?: string) =>
  ({
    header: (name: string) => (name === "x-channel" ? value : undefined),
  }) as Parameters<typeof ChannelMiddleware>[0];

describe("ChannelMiddleware", () => {
  it.each`
    scenario             | value
    ${"is not provided"} | ${undefined}
    ${"is not valid"}    | ${"invalid_value"}
  `(
    "should return an error response when expected header $scenario",
    async ({ value }) => {
      const res = await ChannelMiddleware(makeRequest(value));

      expect(E.isLeft(res));
      if (E.isLeft(res)) {
        expect(res.left.kind).toStrictEqual("IResponseErrorInternal");
        expect(res.left.detail).toMatch(/Failed to decode provided channel$/);
      }
    },
  );

  it.each`
    channel
    ${"BO"}
    ${"APIM"}
  `(
    "should return the channel when expected header is $channel",
    async ({ channel }) => {
      const res = await ChannelMiddleware(makeRequest(channel));

      expect(E.isRight(res));
      if (E.isRight(res)) {
        expect(res.right).toStrictEqual(channel);
      }
    },
  );
});
