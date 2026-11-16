import { NextRequest, NextResponse } from "next/server";
import { authorized, sameOrigin } from "@/lib/admin-auth";
import {
  getPendingBook,
  listPendingBooks,
  reviewBook,
  listStories,
  bookStatus,
  manageBook,
  getStoredStory,
} from "@/lib/content-store";

import { AiReviewError, getAiReview, reviewWithAi } from "@/lib/ai-review";

export const maxDuration = 60;
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
    if (request.nextUrl.searchParams.get("action") === "edit") {
      const book = await getStoredStory(slug, true);
      return book && (await bookStatus(slug)) !== "deleted"
        ? json({ book })
        : json({ error: "El libro no está disponible para editar." }, 404);
    }
    const book = await getPendingBook(slug);
    return book
      ? json({ book, aiReview: await getAiReview(book) })
      : json({ error: "La petición ya no está pendiente." }, 404);
  }
  const requests = [];
  for (const slug of await listPendingBooks()) {
    const book = await getPendingBook(slug);
    if (book) requests.push({ slug, title: book.title, author: book.author });
  }
  const books = [];
  for (const book of await listStories(true)) {
    const status = await bookStatus(book.slug);
    if (status !== "deleted")
      books.push({
        slug: book.slug,
        title: book.title,
        author: book.author,
        status,
      });
  }
  return json({ requests, books });
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
  const action = request.nextUrl.searchParams.get("action");
  if (action === "ai-review") {
    const book = await getPendingBook(slug);
    if (!book) return json({ error: "La petición ya no está pendiente." }, 404);
    try {
      return json({ aiReview: await reviewWithAi(book) });
    } catch (error) {
      if (error instanceof AiReviewError)
        return json({ error: error.message }, error.status);
      throw error;
    }
  }
  if (action === "activate" || action === "deactivate" || action === "delete") {
    if (!(await manageBook(slug, action)))
      return json(
        { error: "El libro ya no está disponible para gestionar." },
        409,
      );
    return json({ managed: true });
  }
  if (decision !== "approve" && decision !== "reject")
    return json({ error: "Decisión no válida." }, 400);
  if (!(await reviewBook(slug, decision === "approve")))
    return json({ error: "La petición ya no está pendiente." }, 409);
  return json({ reviewed: true });
}
