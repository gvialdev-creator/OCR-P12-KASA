/** Erreur d’appel API avec le statut HTTP lorsqu’une réponse a été reçue. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}