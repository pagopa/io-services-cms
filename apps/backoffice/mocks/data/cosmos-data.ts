import { faker } from "@faker-js/faker/locale/it";

export const info = {};
// export const infoResponse = {
//   _dbs: "//dbs/",
//   _rid: "io-p-cosmos-services-cms-italynorth.sql.cosmos.azure.com",
//   _self: "",
//   addresses: "//addresses/",
//   continuousBackupEnabled: true,
//   enableMultipleWriteLocations: false,
//   enableNRegionSynchronousCommit: false,
//   enablePerPartitionFailoverBehavior: false,
//   id: "io-p-cosmos-services-cms",
//   media: "//media/",
//   queryEngineConfiguration:
//     '{"allowNewKeywords":true,"maxJoinsPerSqlQuery":10,"maxQueryRequestTimeoutFraction":0.9,"maxSqlQueryInputLength":524288,"maxUdfRefPerSqlQuery":10,"queryMaxInMemorySortDocumentCount":-1000,"spatialMaxGeometryPointCount":256,"sqlAllowNonFiniteNumbers":false,"sqlDisableOptimizationFlags":0,"sqlQueryILDisableOptimizationFlags":0,"clientDisableOptimisticDirectExecution":false,"queryEnableFullText":true,"queryEnableFullTextPreviewFeatures":false,"enableSpatialIndexing":true,"maxInExpressionItemsCount":2147483647,"maxLogicalAndPerSqlQuery":2147483647,"maxLogicalOrPerSqlQuery":2147483647,"maxSpatialQueryCells":2147483647,"sqlAllowAggregateFunctions":true,"sqlAllowGroupByClause":true,"sqlAllowLike":true,"sqlAllowSubQuery":true,"sqlAllowScalarSubQuery":true,"sqlAllowTop":true}',
//   readPolicy: {
//     primaryReadCoefficient: 1,
//     secondaryReadCoefficient: 1,
//   },
//   readableLocations: [
//     {
//       databaseAccountEndpoint:
//         "https://io-p-cosmos-services-cms-italynorth.documents.azure.com:443/",
//       name: "Italy North",
//     },
//     {
//       databaseAccountEndpoint:
//         "https://io-p-cosmos-services-cms-spaincentral.documents.azure.com:443/",
//       name: "Spain Central",
//     },
//   ],
//   systemReplicationPolicy: {
//     maxReplicasetSize: 4,
//     minReplicaSetSize: 3,
//   },
//   userConsistencyPolicy: {
//     defaultConsistencyLevel: "Session",
//   },
//   userReplicationPolicy: {
//     asyncReplication: false,
//     maxReplicasetSize: 4,
//     minReplicaSetSize: 3,
//   },
//   writableLocations: [
//     {
//       databaseAccountEndpoint:
//         "https://io-p-cosmos-services-cms-italynorth.documents.azure.com:443/",
//       name: "Italy North",
//     },
//   ],
// };

export const aMockServicesLifecyclePkranges = {
  _count: 1,
  _rid: "8xMpAOU8HkA=",
  PartitionKeyRanges: [
    {
      _etag: '"00009f1d-0000-0d00-0000-66b739110000"',
      _rid: "8xMpAOU8HkACAAAAAAAAUA==",
      _self:
        "dbs/8xMpAA==/colls/8xMpAOU8HkA=/pkranges/8xMpAOU8HkACAAAAAAAAUA==/",
      _ts: 1723283729,
      id: "0",
      lsn: 3235,
      maxExclusive: "FF",
      minInclusive: "",
      ownedArchivalPKRangeIds: [],
      parents: [],
      ridPrefix: 0,
      status: "online",
      throughputFraction: 1,
    },
  ],
};

export const aMockServicesLifecycleCollection = {
  _conflicts: "conflicts/",
  _docs: "docs/",
  _etag: '"0000c701-0000-0d00-0000-648ad49d0000"',
  _rid: "8xMpAOU8HkA=",
  _self: "dbs/8xMpAA==/colls/8xMpAOU8HkA=/",
  _sprocs: "sprocs/",
  _triggers: "triggers/",
  _ts: 1686819997,
  _udfs: "udfs/",
  backupPolicy: {
    type: 1,
  },
  conflictResolutionPolicy: {
    conflictResolutionPath: "/_ts",
    conflictResolutionProcedure: "",
    mode: "LastWriterWins",
  },
  geospatialConfig: {
    type: "Geography",
  },
  id: "services-lifecycle",
  indexingPolicy: {
    automatic: true,
    excludedPaths: [
      {
        path: '/"_etag"/?',
      },
    ],
    includedPaths: [
      {
        path: "/*",
      },
    ],
    indexingMode: "consistent",
  },
  partitionKey: {
    kind: "Hash",
    paths: ["/id"],
  },
  uniqueKeyPolicy: {
    uniqueKeys: [],
  },
};

export const aMockServiceLifecycleDocuments = {
  _count: 4,
  _rid: "d9RzAJRFKgw=",
  Documents: [
    {
      _attachments: "attachments/",
      _etag: '"5f0639be-0000-0d00-0000-66ed925d0000"',
      _rid: "8xMpAOU8HkCThB4AAAAAAA==",
      _self: "dbs/8xMpAA==/colls/8xMpAOU8HkA=/docs/8xMpAOU8HkCThB4AAAAAAA==/",
      _ts: 1726845533,
      data: {
        authorized_cidrs: ["0.0.0.0/0"],
        authorized_recipients: ["AAAAAA00A00A000A", "BBBBBB99C88D555I"],
        description: "This is hopefully my final description",
        max_allowed_payment_amount: 0,
        metadata: {
          address: "address",
          app_android: "app_android",
          app_ios: "app_ios",
          category: "STANDARD",
          cta: "cta",
          description: "This is hopefully my final description",
          email: "email",
          pec: "pec",
          phone: "phone",
          privacy_url: "privacy_url",
          scope: "LOCAL",
          support_url: "support_url",
          token_name: "token_name",
          tos_url: "tos_url",
          web_url: "web_url",
        },
        name: "maybe final test 2 after release",
        organization: {
          department_name: "department_name",
          fiscal_code: "00900000002",
          name: "organization_name",
        },
        require_secure_channel: false,
      },
      fsm: {
        lastTransition: "skip sync to Legacy 20240920 - ADD_MODIFIED_AT",
        state: "deleted",
      },
      id: "01H4G2BNFRTYBEJQ8MTMNMG4J9",
      modified_at: 1700222048000,
    },
    {
      _attachments: "attachments/",
      _etag: '"3e0050f7-0000-5b00-0000-680f83cc0000"',
      _rid: "8xMpAOU8HkCVhB4AAAAAAA==",
      _self: "dbs/8xMpAA==/colls/8xMpAOU8HkA=/docs/8xMpAOU8HkCVhB4AAAAAAA==/",
      _ts: 1745847244,
      data: {
        authorized_cidrs: ["0.0.0.0/0"],
        authorized_recipients: ["AAAAAA00A00A000A"],
        description:
          "This is a test service update add topic, edit from devPortal",
        max_allowed_payment_amount: 10000,
        metadata: {
          address: "via della via4",
          category: "STANDARD",
          group_id: "67ea979dae8c1f7aad70707b",
          privacy_url: "https://www.example.com",
          scope: "LOCAL",
          support_url: "https://www.example2.com",
          token_name: "token_name",
          topic_id: 3,
        },
        name: "Test Update service After Apim Upgrade",
        organization: {
          fiscal_code: "00900000002",
          name: "PROD-Test-00900000002",
        },
        require_secure_channel: false,
      },
      fsm: {
        lastTransition: "apply edit on draft",
        state: "draft",
      },
      id: "01H50681HXEHJS4TPD7BDPJXNG",
      modified_at: 1745847244991,
    },
    {
      _attachments: "attachments/",
      _etag: '"5f06adbe-0000-0d00-0000-66ed925e0000"',
      _rid: "8xMpAOU8HkCahB4AAAAAAA==",
      _self: "dbs/8xMpAA==/colls/8xMpAOU8HkA=/docs/8xMpAOU8HkCahB4AAAAAAA==/",
      _ts: 1726845534,
      data: {
        authorized_cidrs: ["0.0.0.0/0"],
        authorized_recipients: ["AAAAAA00A00A000A"],
        description: "Vecchio servizio creato su legacy",
        max_allowed_payment_amount: 0,
        metadata: {
          address: "via della via",
          app_android: "https://google.com",
          app_ios: "https://google.com",
          category: "STANDARD",
          description: "Vecchio servizio creato su legacy",
          email: "test@testmail.it",
          pec: "test@testpec.it",
          phone: "3333333333",
          privacy_url: "https://google.com",
          scope: "LOCAL",
          support_url: "http://www.example.com",
          tos_url: "https://google.com",
          web_url: "https://google.com",
        },
        name: "Test Enti e Servizi ggggfgy",
        organization: {
          department_name: "IO Enti e Servizi",
          fiscal_code: "00900000002",
          name: "PagoPa",
        },
        require_secure_channel: false,
      },
      fsm: {
        lastTransition: "skip sync to Legacy 20240920 - ADD_MODIFIED_AT",
        state: "deleted",
      },
      id: "01H2FM7VAH06Q050KTA2ND7D4A",
      modified_at: 1711036753000,
    },
    {
      _attachments: "attachments/",
      _etag: '"0e007b93-0000-5b00-0000-67ea981f0000"',
      _rid: "8xMpAOU8HkCbhB4AAAAAAA==",
      _self: "dbs/8xMpAA==/colls/8xMpAOU8HkA=/docs/8xMpAOU8HkCbhB4AAAAAAA==/",
      _ts: 1743427615,
      data: {
        authorized_cidrs: ["0.0.0.0/0"],
        authorized_recipients: ["AAAAAA00A00A000A"],
        description: "This is a test service for full sync workflow [EDITED]",
        max_allowed_payment_amount: 10000,
        metadata: {
          address: "via della via",
          category: "STANDARD",
          group_id: "67ea979dae8c1f7aad70707b",
          privacy_url: "https://www.example.com",
          scope: "LOCAL",
          support_url: "http://www.example.com",
          token_name: "token_name",
          topic_id: 0,
        },
        name: "Test stesso nome",
        organization: {
          fiscal_code: "00900000002",
          name: "PROD-Test-00900000002",
        },
        require_secure_channel: false,
      },
      fsm: {
        lastTransition: "apply edit on draft",
        state: "draft",
      },
      id: "01H59SH0VAP1NW2SSQX6E2SYCY",
      modified_at: 1743427615115,
    },
  ],
};

export const aMockServiceLifecycleBulkFetchDocuments = (id?: string) => ({
  eTag: faker.string.uuid(),
  resourceBody: {
    data: {
      authorized_cidrs: ["0.0.0.0/0"],
      authorized_recipients: ["AAAAAA00A00A000A"],
      description: "This is a test service for full sync workflow [EDITED]",
      max_allowed_payment_amount: 10000,
      metadata: {
        address: "via della via",
        category: "STANDARD",
        group_id: "67ea979dae8c1f7aad70707b",
        privacy_url: "https://www.example.com",
        scope: "LOCAL",
        support_url: "http://www.example.com",
        token_name: "token_name",
        topic_id: 0,
      },
      name: "Test stesso nome",
      organization: {
        fiscal_code: "00900000002",
        name: "PROD-Test-00900000002",
      },
      require_secure_channel: false,
    },
    fsm: {
      lastTransition: "apply edit on draft",
      state: "draft",
    },
    id: id ?? faker.string.uuid(),
    modified_at: 1743427615115,
  },
  statusCode: 200,
});
