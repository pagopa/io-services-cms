const { BlobServiceClient } = require("@azure/storage-blob");
const { QueueServiceClient } = require("@azure/storage-queue");

const connectionString =
  "DefaultEndpointsProtocol=http;" +
  "AccountName=devstoreaccount1;" +
  "AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;" +
  "BlobEndpoint=http://azurite:10000/devstoreaccount1;" +
  "QueueEndpoint=http://azurite:10001/devstoreaccount1;" +
  "TableEndpoint=http://azurite:10002/devstoreaccount1;";

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);
const queueServiceClient =
  QueueServiceClient.fromConnectionString(connectionString);

const containers = ["services", "activations"];
const queues = [
  "request-review",
  "request-review-poison",
  "request-review-legacy",
  "request-review-legacy-poison",
  "request-publication",
  "request-publication-poison",
  "request-historicization",
  "request-historicization-poison",
  "request-sync-legacy",
  "request-sync-legacy-poison",
  "request-sync-cms",
  "request-sync-cms-poison",
  "request-validation",
  "request-validation-poison",
  "request-deletion",
  "request-deletion-poison",
  "request-detail",
  "request-detail-poison",
  "request-services-publication-ingestion-retry",
  "request-services-publication-ingestion-retry-poison",
  "request-services-lifecycle-ingestion-retry",
  "request-services-lifecycle-ingestion-retry-poison",
  "request-services-history-ingestion-retry",
  "request-services-history-ingestion-retry-poison",
];
const createContainerIfNotExists = async (name) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(name);
    await containerClient.createIfNotExists();
    console.log(`Container ${name} created.`);
  } catch (error) {
    console.error(`Error creating container ${name}:`, error);
  }
};

const createQueueIfNotExists = async (name) => {
  try {
    const queueClient = queueServiceClient.getQueueClient(name);
    await queueClient.createIfNotExists();
    console.log(`Queue ${name} created.`);
  } catch (error) {
    console.error(`Error creating queue ${name}:`, error);
  }
};

(async () => {
  await Promise.all([
    ...containers.map(createContainerIfNotExists),
    ...queues.map(createQueueIfNotExists),
  ]);
})();
