import { DateUtils, ServicePublication } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { handler } from "../on-service-publication-change";

const aServicePublicationCosmosResource = {
  id: "aServiceId",
  data: {
    name: "aServiceName",
    description: "aServiceDescription",
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
  },
  _ts: DateUtils.unixSeconds(),
  _etag: "aServiceEtag",
} as unknown as ServicePublication.CosmosResource;

const { _ts, _etag, ...aService } = aServicePublicationCosmosResource;
const expectedVersion = _etag;
const aLastUpdateTs = DateUtils.unixSeconds();

describe("On Service Publication Change Handler", () => {
  it.each`
    scenario                     | item                                                                                                    | expected
    ${"request-historicization"} | ${{ ...aServicePublicationCosmosResource, fsm: { state: "unpublished" } }}                              | ${{ requestHistoricization: { ...aService, version: expectedVersion, last_update_ts: _ts, fsm: { state: "unpublished" } } }}
    ${"request-historicization"} | ${{ ...aServicePublicationCosmosResource, fsm: { state: "published" } }}                                | ${{ requestHistoricization: { ...aService, version: expectedVersion, last_update_ts: _ts, fsm: { state: "published" } } }}
    ${"request-historicization"} | ${{ ...aServicePublicationCosmosResource, fsm: { state: "published" }, last_update_ts: aLastUpdateTs }} | ${{ requestHistoricization: { ...aService, version: expectedVersion, last_update_ts: aLastUpdateTs, fsm: { state: "published" } } }}
  `("should map an item to a $scenario action", async ({ item, expected }) => {
    const res = await handler({ item })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
  });
});
