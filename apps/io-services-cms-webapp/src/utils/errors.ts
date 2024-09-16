export class QueuePermanentError extends Error {
  constructor(message?: string) {
    super(message); // pass the message up to the Error constructor
    this.name = "QueuePermanentError"; // set the error name
  }
}
