import { IPString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { describe, expect, it } from "vitest";
import { checkSourceIp } from "../check-source-ip";

describe("checkSourceIp", () => {
  it.each`
    scenario                                                                              | ip                     | authzCidrs          | expectedErrorKind                         | expectedErrorDetailRegExp
    ${"provided ip is empty"}                                                             | ${O.none}              | ${new Set()}        | ${"IResponseErrorInternal"}               | ${/IP address cannot be extracted from the request$/}
    ${"provided ip is not empty, but ip is not included in authz CIDRs (without prefix)"} | ${O.some("127.0.0.2")} | ${["127.0.0.1"]}    | ${"IResponseErrorForbiddenNotAuthorized"} | ${/.*$/}
    ${"provided ip is not empty, but ip is not included in authz CIDRs (with prefix)"}    | ${O.some("127.0.0.2")} | ${["127.0.0.1/31"]} | ${"IResponseErrorForbiddenNotAuthorized"} | ${/.*$/}
  `(
    "should return an error response when $scenario",
    ({ ip, authzCidrs, expectedErrorKind, expectedErrorDetailRegExp }) => {
      // when
      const res = checkSourceIp(ip, authzCidrs);

      // then
      expect(E.isLeft(res)).toBeTruthy();
      if (E.isLeft(res)) {
        expect(res.left.kind).toStrictEqual(expectedErrorKind);
        expect(res.left.detail).toMatch(expectedErrorDetailRegExp);
      }
    },
  );

  it.each`
    scenario                                                | authzCidrs
    ${"authz CIDRs is empty"}                               | ${new Set()}
    ${"ip is not included in authz CIDRs (without prefix)"} | ${["127.0.0.1"]}
    ${"ip is not included in authz CIDRs (with prefix)"}    | ${["127.0.0.1/24"]}
  `("should return the valid ip when $scenario", ({ authzCidrs }) => {
    // given
    const ip = "127.0.0.1" as IPString;

    // when
    const res = checkSourceIp(O.some(ip), authzCidrs);

    // then
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(ip);
    }
  });
});
