import {
  DateUtils,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { IConfig } from "../../config";
import { SYNC_FROM_LEGACY } from "../../utils/synchronizer";
import { handler } from "../on-service-lifecycle-change";

const aServiceLifecycleCosmosResource = {
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
      group_id: "group_id",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
  },
  _ts: DateUtils.unixTimestampInSeconds(),
  _etag: "aServiceEtag",
} as unknown as ServiceLifecycle.CosmosResource;

const { _ts, _etag, ...aService } = aServiceLifecycleCosmosResource;

const aPublicationService = {
  ...aService,
  data: {
    ...aServiceLifecycleCosmosResource.data,
    max_allowed_payment_amount: 1000000,
    metadata: {
      ...aServiceLifecycleCosmosResource.data.metadata,
      group_id: undefined,
    },
  },
} as unknown as ServicePublication.ItemType;

const expectedHistoricization = {
  modified_at: DateUtils.unixSecondsToMillis(_ts),
  version: _etag,
};

const aModifiedAt = DateUtils.unixTimestamp();

describe("On Service Lifecycle Change Handler", () => {
  it.each`
    scenario                                     | item                                                                                                    | expected
    ${"request-review"}                          | ${{ ...aServiceLifecycleCosmosResource, version: "aVersion", fsm: { state: "submitted" } }}             | ${{ requestReview: { ...aService, version: expectedHistoricization.version }, requestHistoricization: { ...aService, ...expectedHistoricization, fsm: { state: "submitted" } } }}
    ${"no-op (empty object)"}                    | ${{ ...aServiceLifecycleCosmosResource, fsm: { state: "draft" }, modified_at: aModifiedAt }}            | ${{ requestHistoricization: { ...aService, ...expectedHistoricization, modified_at: aModifiedAt, fsm: { state: "draft" } } }}
    ${"no-op (empty object) modified_at valued"} | ${{ ...aServiceLifecycleCosmosResource, fsm: { state: "draft" } }}                                      | ${{ requestHistoricization: { ...aService, ...expectedHistoricization, fsm: { state: "draft" } } }}
    ${"request-publication"}                     | ${{ ...aServiceLifecycleCosmosResource, fsm: { state: "approved", autoPublish: true } }}                | ${{ requestPublication: { ...aPublicationService, autoPublish: true }, requestHistoricization: { ...aService, ...expectedHistoricization, fsm: { state: "approved", autoPublish: true } } }}
    ${"request-publication-with-no-autopublish"} | ${{ ...aServiceLifecycleCosmosResource, fsm: { state: "approved" } }}                                   | ${{ requestPublication: { ...aPublicationService, autoPublish: false }, requestHistoricization: { ...aService, ...expectedHistoricization, fsm: { state: "approved" } } }}
    ${"no-op (empty object)"}                    | ${{ ...aServiceLifecycleCosmosResource, fsm: { state: "rejected" } }}                                   | ${{ requestHistoricization: { ...aService, ...expectedHistoricization, fsm: { state: "rejected" } } }}
    ${"request-deletion"}                        | ${{ ...aServiceLifecycleCosmosResource, fsm: { state: "deleted" } }}                                    | ${{ requestDeletion: { id: aPublicationService.id }, requestHistoricization: { ...aService, ...expectedHistoricization, fsm: { state: "deleted" } } }}
    ${"request-deletion legacy"}                 | ${{ ...aServiceLifecycleCosmosResource, fsm: { state: "deleted", lastTransition: SYNC_FROM_LEGACY } }}  | ${{ requestDeletion: { id: aPublicationService.id }, requestHistoricization: { ...aService, ...expectedHistoricization, fsm: { state: "deleted", lastTransition: SYNC_FROM_LEGACY } } }}
    ${"no-op (approved from Legacy)"}            | ${{ ...aServiceLifecycleCosmosResource, fsm: { state: "approved", lastTransition: SYNC_FROM_LEGACY } }} | ${{ requestHistoricization: { ...aService, ...expectedHistoricization, fsm: { state: "approved", lastTransition: SYNC_FROM_LEGACY } } }}
  `("should map an item to a $scenario action", async ({ item, expected }) => {
    const res = handler({
      MAX_ALLOWED_PAYMENT_AMOUNT: 1000000,
    } as unknown as IConfig)({
      item,
    });
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      const actual = res.right;
      expect(actual.requestHistoricization.modified_at).toBeDefined();
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
          modified_at: null,
          version: null,
        },
        ...actualOthersActions,
      }).toStrictEqual({
        requestHistoricization: {
          ...expectedRequestHistoricization,
          modified_at: null,
          version: null,
        },
        ...expectedOthersActions,
      });
    }
  });
});
