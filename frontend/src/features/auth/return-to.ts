/**
 * Valide une destination de retour strictement interne avant une redirection.
 * Rejette les URL externes, les chemins `//`, les caractères de contrôle et
 * les valeurs de plus de 2048 caractères; retourne le chemin/query/hash normalisé.
 */
export function getSafeReturnTo(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) {
    return null;
  }

  try {
    const destination = new URL(value, "https://kasa.invalid");
    if (destination.origin !== "https://kasa.invalid") return null;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}