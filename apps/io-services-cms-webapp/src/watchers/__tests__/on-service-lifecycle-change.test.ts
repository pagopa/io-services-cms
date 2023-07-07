import { ServiceLifecycle, ServicePublication } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { IConfig } from "../../config";
import { SYNC_FROM_LEGACY } from "../../utils/synchronizer";
import { handler } from "../on-service-lifecycle-change";

const aService = {
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
} as unknown as ServiceLifecycle.ItemType;

const aPublicationService = {
  ...aService,
  data: { ...aService.data, max_allowed_payment_amount: 1000000 },
} as unknown as ServicePublication.ItemType;

describe("On Service Lifecycle Change Handler", () => {
  it.each`
    scenario                                     | item                                                                             | expected
    ${"request-review"}                          | ${{ ...aService, version: "aVersion", fsm: { state: "submitted" } }}             | ${{ requestReview: { ...aService, version: "aVersion" }, requestHistoricization: { ...aService, fsm: { state: "submitted" } } }}
    ${"no-op (empty object)"}                    | ${{ ...aService, fsm: { state: "draft" } }}                                      | ${{ requestHistoricization: { ...aService, fsm: { state: "draft" } } }}
    ${"request-publication"}                     | ${{ ...aService, fsm: { state: "approved", autoPublish: true } }}                | ${{ requestPublication: { ...aPublicationService, autoPublish: true }, requestHistoricization: { ...aService, fsm: { state: "approved", autoPublish: true } } }}
    ${"request-publication-with-no-autopublish"} | ${{ ...aService, fsm: { state: "approved" } }}                                   | ${{ requestPublication: { ...aPublicationService, autoPublish: false }, requestHistoricization: { ...aService, fsm: { state: "approved" } } }}
    ${"no-op (empty object)"}                    | ${{ ...aService, fsm: { state: "rejected" } }}                                   | ${{ requestHistoricization: { ...aService, fsm: { state: "rejected" } } }}
    ${"no-op (empty object)"}                    | ${{ ...aService, fsm: { state: "deleted" } }}                                    | ${{ requestHistoricization: { ...aService, fsm: { state: "deleted" } } }}
    ${"no-op (approved from Legacy)"}            | ${{ ...aService, fsm: { state: "approved", lastTransition: SYNC_FROM_LEGACY } }} | ${{ requestHistoricization: { ...aService, fsm: { state: "approved", lastTransition: SYNC_FROM_LEGACY } } }}
  `("should map an item to a $scenario action", async ({ item, expected }) => {
    const res = await handler({
      MAX_ALLOWED_PAYMENT_AMOUNT: 1000000,
    } as unknown as IConfig)({
      item,
    })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      const actual = res.right;
      expect(actual.requestHistoricization.last_update).not.empty;
      const {
        requestHistoricization: { ...actualRequestHistoricization },
        ...actualOthersActions
      } = actual;
      const {
        requestHistoricization: { ...expectedRequestHistoricization },
        ...expectedOthersActions
      } = expected;
      expect({
        requestHistoricization: {
          ...actualRequestHistoricization,
          last_update: null,
          version: null,
        },
        ...actualOthersActions,
      }).toStrictEqual({
        requestHistoricization: {
          ...expectedRequestHistoricization,
          last_update: null,
          version: null,
        },
        ...expectedOthersActions,
      });
    }
  });
});
