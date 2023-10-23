export class ApiKeyNotFoundError extends Error {
  constructor(message: string) {
    super("the API does not exists");
    this.name = "ApiKeyNotFoundError";
    this.message = message;
  }
}


export class InstitutionNotFoundError extends Error {
  constructor(message: string) {
    super("the Institution does not exists");
    this.name = "InstitutionNotFoundError";
    this.message = message;
  }
}