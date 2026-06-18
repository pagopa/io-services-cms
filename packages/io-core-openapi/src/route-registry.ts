import type { ZodType } from "zod";

import type { AnyRouteContract } from "./generate.js";

export class RouteRegistry {
  private readonly contracts: AnyRouteContract[] = [];
  private readonly schemas: ZodType[] = [];
  private readonly schemaIds = new Set<string>();

  add(contract: AnyRouteContract): void {
    this.contracts.push(contract);
  }

  /**
   * Registers a named schema (one with `.meta({ id })`) for inclusion in the
   * generated OpenAPI document. Duplicate ids are silently ignored.
   */
  addSchema(schema: ZodType): void {
    const meta = (
      schema as { meta?: () => undefined | { id?: string } }
    ).meta?.();
    const id = meta?.id;
    if (id === undefined || this.schemaIds.has(id)) return;
    this.schemaIds.add(id);
    this.schemas.push(schema);
  }

  getAll(): readonly AnyRouteContract[] {
    return this.contracts;
  }

  getSchemas(): readonly ZodType[] {
    return this.schemas;
  }
}
