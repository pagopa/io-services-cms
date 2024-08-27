import { ServicePublication } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";

import { handler } from "../on-service-publication-change";

const aServicePublicationCosmosResource = {
  _etag: "aServiceEtag",
  _ts: Math.floor(Date.now() / 1000),
  data: {
    authorized_recipients: [],
    description: "aServiceDescription",
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    name: "aServiceName",
    organization: {
      fiscal_code: "12345678901",
      name: "anOrganizationName",
    },
    require_secure_channel: false,
  },
  id: "aServiceId",
} as unknown as ServicePublication.CosmosResource;

const { _etag, _ts, ...aService } = aServicePublicationCosmosResource;

const expectedLastUpdate = new Date(_ts * 1000).toISOString();
const expectedVersion = _etag;

describe("On Service Publication Change Handler", () => {
  it.each`
    scenario                     | item                                                                       | expected
    ${"request-historicization"} | ${{ ...aServicePublicationCosmosResource, fsm: { state: "unpublished" } }} | ${{ requestHistoricization: { ...aService, fsm: { state: "unpublished" }, last_update: expectedLastUpdate, version: expectedVersion } }}
    ${"request-historicization"} | ${{ ...aServicePublicationCosmosResource, fsm: { state: "published" } }}   | ${{ requestHistoricization: { ...aService, fsm: { state: "published" }, last_update: expectedLastUpdate, version: expectedVersion } }}
  `("should map an item to a $scenario action", async ({ expected, item }) => {
    const res = await handler({ item })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
  });
});
