import { NextRequest, NextResponse } from "next/server";
import { authorized, sameOrigin } from "@/lib/admin-auth";
import {
  getPendingBook,
  listPendingBooks,
  reviewBook,
} from "@/lib/content-store";

export const dynamic = "force-dynamic";
function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function GET(request: NextRequest) {
  if (!authorized(request))
    return json(
      { error: "Clave de administrador no válida o sin configurar." },
      401,
    );
  const slug = request.nextUrl.searchParams.get("slug");
  if (slug !== null) {
    const book = await getPendingBook(slug);
    return book
      ? json({ book })
      : json({ error: "La petición ya no está pendiente." }, 404);
  }
  const requests = [];
  for (const slug of await listPendingBooks()) {
    const book = await getPendingBook(slug);
    if (book) requests.push({ slug, title: book.title, author: book.author });
  }
  return json({ requests });
}
export async function POST(request: NextRequest) {
  if (!authorized(request))
    return json(
      { error: "Clave de administrador no válida o sin configurar." },
      401,
    );
  if (!sameOrigin(request)) return json({ error: "Origen no permitido." }, 403);
  const slug = request.nextUrl.searchParams.get("slug") || "";
  const decision = request.nextUrl.searchParams.get("decision");
  if (decision !== "approve" && decision !== "reject")
    return json({ error: "Decisión no válida." }, 400);
  if (!(await reviewBook(slug, decision === "approve")))
    return json({ error: "La petición ya no está pendiente." }, 409);
  return json({ reviewed: true });
}
