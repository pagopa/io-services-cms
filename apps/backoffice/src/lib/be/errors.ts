export class ApiKeyNotFoundError extends Error {
  constructor(message: string) {
    super("the API key already exists");
    this.name = "ApiKeyAlreadyExistsError";
    this.message = message;
  }
}