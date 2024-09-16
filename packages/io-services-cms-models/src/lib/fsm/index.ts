export * from "./types";

import { createCosmosStore } from "./store.cosmos";
import { createMemoryStore } from "./store.memory";

export const stores = {
  createCosmosStore,
  createMemoryStore,
};
