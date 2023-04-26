export * from "./types";

import { createMemoryStore } from "./store.memory";
import { createCosmosStore } from "./store.cosmos";

export const stores = {
  createMemoryStore,
  createCosmosStore,
};
