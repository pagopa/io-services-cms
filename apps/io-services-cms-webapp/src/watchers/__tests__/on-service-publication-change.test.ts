import { ServicePublication } from "@io-services-cms/models";
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
  _ts: Math.floor(Date.now() / 1000),
  _etag: "aServiceEtag",
} as unknown as ServicePublication.CosmosResource;

const { _ts, _etag, ...aService } = aServicePublicationCosmosResource;

const expectedLastUpdate = new Date(_ts * 1000).toISOString();
const expectedVersion = _etag;

describe("On Service Publication Change Handler", () => {
  it.each`
    scenario                     | item                                                                       | expected
    ${"request-historicization"} | ${{ ...aServicePublicationCosmosResource, fsm: { state: "unpublished" } }} | ${{ requestHistoricization: { ...aService, version: expectedVersion, last_update: expectedLastUpdate, fsm: { state: "unpublished" } } }}
    ${"request-historicization"} | ${{ ...aServicePublicationCosmosResource, fsm: { state: "published" } }}   | ${{ requestHistoricization: { ...aService, version: expectedVersion, last_update: expectedLastUpdate, fsm: { state: "published" } } }}
  `("should map an item to a $scenario action", async ({ item, expected }) => {
    const res = await handler({ item })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
  });
});
