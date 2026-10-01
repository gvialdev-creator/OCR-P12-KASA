export async function hasValidSession(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.API_BASE_URL) return false;

  let userId: number;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    userId = payload.id;
  } catch {
    return false;
  }
  if (!Number.isSafeInteger(userId) || userId <= 0) return false;

  try {
    const response = await fetch(new URL(`/api/users/${userId}`, process.env.API_BASE_URL), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}