import { CIDR } from "@pagopa/io-functions-commons/dist/generated/definitions/CIDR";
import { ClientIp } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/client_ip_middleware";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import { IPString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as RS from "fp-ts/lib/ReadonlySet";
import { pipe } from "fp-ts/lib/function";
import { BlockList } from "net";

/**
 * Checks if an IP address is contained within a list of CIDR ranges.
 *
 * @param ip - The IP address to check.
 * @param cidrList - An array of CIDR ranges in "IP/prefix" format (e.g., "192.168.0.0/24").
 * @returns - `true` if the IP is contained within the CIDR list, otherwise `false`.
 */
const isIpInCidrList = (ip: IPString, cidrList: ReadonlySet<CIDR>): boolean =>
  pipe(
    Array.from(cidrList),
    RA.reduce(new BlockList(), (blockList, cidr) => {
      const [subnet, prefix] = cidr.split("/");
      if (prefix) blockList.addSubnet(subnet, parseInt(prefix, 10));
      else blockList.addAddress(subnet);
      return blockList;
    }),
    (blockList) => blockList.check(ip),
  );

/**
 * Checks if an IP address is contained within a list of CIDR ranges.
 * @param maybeClientIp - The IP address to check.
 * @param authzCidrs - An array of CIDR ranges in "IP/prefix" format (e.g., "192.168.0.0/24").
 * @returns Either an error response or the validated ip
 */
const checkSourceIp = (
  maybeClientIp: ClientIp,
  authzCidrs: ReadonlySet<CIDR>,
): E.Either<
  IResponseErrorForbiddenNotAuthorized | IResponseErrorInternal,
  IPString
> =>
  pipe(
    maybeClientIp,
    E.fromOption(() =>
      ResponseErrorInternal("IP address cannot be extracted from the request"),
    ),
    E.chainW(
      E.fromPredicate(
        (clientIp) =>
          RS.isEmpty(authzCidrs) || isIpInCidrList(clientIp, authzCidrs),
        () => ResponseErrorForbiddenNotAuthorized,
      ),
    ),
  );

export { checkSourceIp };
