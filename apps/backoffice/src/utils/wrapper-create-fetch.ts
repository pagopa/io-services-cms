/**
 * Fetch wrapper that converts HTTP methods to uppercase.
 *
 * Problem: The PagoPa OpenAPI codegen (@pagopa/openapi-codegen-ts) generates HTTP methods
 * in lowercase (e.g. "patch", "get", "post") in the client code.
 *
 * Next App Router requires route handler functions to be named in UPPERCASE (e.g. `export async function PATCH()`).
 * When a request arrives with a lowercase method like "patch", Next.js cannot match it to the PATCH() handler function,
 * resulting in an empty response or 405 Method Not Allowed error.
 *
 * This wrapper intercepts all fetch calls and converts the HTTP method to uppercase
 * before sending the request, ensuring compatibility with Next.js route handlers.
 *
 * @returns A fetch implementation that normalizes HTTP methods to uppercase
 */
export const createFetchWithUpperCaseHttpMethod =
  (fetchFn: typeof fetch = fetch): typeof fetch =>
  async (input, init) => {
    const initMaiusc =
      init && init.method
        ? {
            ...init,
            method: init.method.toUpperCase(),
          }
        : init;
    return fetchFn(input, initMaiusc);
  };
