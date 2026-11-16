import { MAX_COVER_BYTES, validateCover } from "@/lib/book-cover";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { authorized, sameOrigin } from "@/lib/admin-auth";
import {
  bookStatus,
  getStoredStory,
  saveBookEdit,
  submitBook,
} from "@/lib/content-store";
import { MAX_TXT_BYTES, parseTxt } from "@/lib/import-txt";
import { languages, type Locale } from "@/i18n/messages";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return writeBook(request);
}
export async function PATCH(request: NextRequest) {
  if (!authorized(request))
    return NextResponse.json(
      { error: "Clave de administrador no válida." },
      { status: 401 },
    );
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  const slug = request.nextUrl.searchParams.get("slug") || "";
  const book = await getStoredStory(slug, true);
  if (!book || (await bookStatus(slug)) === "deleted")
    return NextResponse.json(
      { error: "El libro no está disponible para editar." },
      { status: 404 },
    );
  return writeBook(request, book);
}
async function writeBook(
  request: NextRequest,
  existing?: Awaited<ReturnType<typeof getStoredStory>>,
) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  const reader = request.body?.getReader();
  if (!reader)
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  let title: string,
    author: string,
    genre: string,
    locale: Locale,
    content,
    cover: string | undefined;
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (
        size >
        MAX_TXT_BYTES * 6 + Math.ceil(MAX_COVER_BYTES / 3) * 4 + 4096
      ) {
        await reader.cancel();
        return NextResponse.json(
          { error: "El archivo supera el tamaño permitido." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const body = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)),
    );
    if (
      typeof body.title !== "string" ||
      !body.title.trim() ||
      body.title.trim().length > 160
    )
      throw new Error("Introduce un título de hasta 160 caracteres.");
    if (
      typeof body.author !== "string" ||
      !body.author.trim() ||
      body.author.trim().length > 120
    )
      throw new Error("Introduce un autor de hasta 120 caracteres.");
    if (!["fantasy", "mystery", "romance", "drama"].includes(body.genre))
      throw new Error("Selecciona un género válido.");
    if (
      typeof body.locale !== "string" ||
      !Object.hasOwn(languages, body.locale)
    )
      throw new Error("Selecciona un idioma válido.");
    if ((!existing || body.text !== undefined) && typeof body.text !== "string")
      throw new Error("Falta el texto del libro.");
    cover =
      body.cover === undefined ? existing?.cover : validateCover(body.cover);
    title = body.title.trim();
    author = body.author.trim();
    genre = body.genre;
    locale = body.locale;
    content =
      typeof body.text === "string" ? parseTxt(body.text, title) : undefined;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof SyntaxError || error instanceof TypeError
            ? "El archivo o los datos no son válidos."
            : (error as Error).message,
      },
      { status: 400 },
    );
  }
  if (existing) {
    const oldLocale = existing.originalLocale ?? "es";
    const translations = { ...existing.translations };
    if (locale !== oldLocale && translations[locale]) {
      return NextResponse.json(
        {
          error:
            "El libro ya tiene una traducción en ese idioma. Elige otro idioma para conservarla.",
        },
        { status: 409 },
      );
    }
    translations[locale] = content ?? { ...translations[oldLocale]!, title };
    if (locale !== oldLocale) delete translations[oldLocale];
    try {
      await saveBookEdit({
        ...existing,
        title,
        author,
        genre,
        originalLocale: locale,
        translations,
        cover,
        source: content ? undefined : existing.source,
      });
      return NextResponse.json({ title, author, slug: existing.slug });
    } catch {
      return NextResponse.json(
        { error: "No se pudo guardar el libro." },
        { status: 500 },
      );
    }
  }
  if (!content)
    return NextResponse.json(
      { error: "Falta el texto del libro." },
      { status: 400 },
    );
  const prefix =
    title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "libro";
  const slug = `${prefix}-${randomUUID()}`;
  try {
    await submitBook({
      slug,
      title,
      author,
      genre,
      cover,
      originalLocale: locale,
      translations: { [locale]: content },
    });
    return NextResponse.json(
      { slug, title, pages: content.pages.length },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "No se pudo guardar el libro. Comprueba el almacenamiento del servidor.",
      },
      { status: 500 },
    );
  }
}
