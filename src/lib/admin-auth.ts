import { NextRequest } from "next/server";
import { timingSafeEqual, createHash } from "node:crypto";
export function sameOrigin(request: NextRequest) {
  try {
    return (
      new URL(request.headers.get("origin") || "").host ===
      request.headers.get("host")
    );
  } catch {
    return false;
  }
}
export function authorized(request: NextRequest) {
  const secret = process.env.ADMIN_TOKEN;
  if (!secret || secret.length < 32) return false;
  const token =
    request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  return timingSafeEqual(
    createHash("sha256").update(token).digest(),
    createHash("sha256").update(secret).digest(),
  );
}
