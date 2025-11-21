import { HttpResponse, http } from "msw";

/**
 * Handler per simulare la Managed Identity in locale.
 * Evita warning MSW e chiamate reali a 169.254.169.254.
 */
export const buildHandlers = () => [
  http.get(
    "http://169.254.169.254/metadata/identity/oauth2/token",
    // possiamo anche controllare i query param se vogliamo, ma non è necessario
    () =>
      HttpResponse.json(
        {
          error: "Managed identity not available in local dev environment",
        },
        { status: 404 },
      ),
  ),
];
