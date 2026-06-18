export class BaseError extends Error {
  kind: string;
  tag: string;

  protected constructor(message: string) {
    super(message);

    this.kind = "BaseError";
    this.tag = "base-error";
  }
}

export class ConflictError extends BaseError {
  override readonly kind = "ConflictError" as const;
  override tag = "conflict";

  constructor(message: string) {
    super("Conflict: " + message);
  }
}

export class ForbiddenError extends BaseError {
  override readonly kind = "ForbiddenError" as const;
  override tag = "forbidden";

  constructor() {
    super("Forbidden: you don't have permission to access this resource");
  }
}

export class GenericError extends BaseError {
  override readonly kind = "GenericError" as const;
  override tag = "generic-error";

  constructor(message: string) {
    super("Generic error: " + message);
  }
}

export class NotFoundError extends BaseError {
  entityName: string;
  override readonly kind = "NotFoundError" as const;
  override tag = "not-found";

  constructor(entityName: string, message: string) {
    super("Unable to find " + entityName + ": " + message);
    this.entityName = entityName;
  }
}

export class PreconditionFailedError extends BaseError {
  override readonly kind = "PreconditionFailedError" as const;
  override tag = "precondition-failed";

  constructor(message: string) {
    super("Precondition failed: " + message);
  }
}

export class UnprocessableEntityError extends BaseError {
  override readonly kind = "UnprocessableEntityError" as const;
  override tag = "unprocessable-entity";

  constructor(message: string) {
    super("Unprocessable entity: " + message);
  }
}

export class ValidationError extends BaseError {
  override readonly kind = "ValidationError" as const;
  override tag = "validation-error";

  constructor(message: string) {
    super("Validation error: " + message);
  }
}
