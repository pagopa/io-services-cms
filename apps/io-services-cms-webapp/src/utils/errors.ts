export class PermanentError extends Error {
  constructor(message?: string) {
    super(message); // pass the message up to the Error constructor
    this.name = "PermanentError"; // set the error name
  }
}
