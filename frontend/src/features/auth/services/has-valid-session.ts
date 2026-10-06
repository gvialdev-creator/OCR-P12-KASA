export interface SessionUser {
  id: number;
  role: "owner" | "admin" | "client";
  name: string;
  email: string | null;
  picture: string | null;
}

export async function getSessionUser(token: string | undefined): Promise<SessionUser | null> {
  if (!token || !process.env.API_BASE_URL) return null;

  let userId: number;
  let tokenEmail: string | null = null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    userId = payload.id;
    tokenEmail = typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
  if (!Number.isSafeInteger(userId) || userId <= 0) return null;

  try {
    const response = await fetch(new URL(`/api/users/${userId}`, process.env.API_BASE_URL), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const user: unknown = await response.json();
    if (!user || typeof user !== "object" || !("id" in user) || user.id !== userId ||
      !("role" in user) || !["owner", "admin", "client"].includes(String(user.role)) ||
      !("name" in user) || typeof user.name !== "string" ||
      ("email" in user && user.email !== null && typeof user.email !== "string") ||
      !("picture" in user) || (user.picture !== null && typeof user.picture !== "string")) return null;
    return {
      id: userId,
      role: user.role as SessionUser["role"],
      name: user.name,
      email: "email" in user && typeof user.email === "string" ? user.email : tokenEmail,
      picture: user.picture,
    };
  } catch {
    return null;
  }
}

export async function hasValidSession(token: string | undefined): Promise<boolean> {
  return (await getSessionUser(token)) !== null;
}