import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { sameOrigin } from "@/lib/admin-auth";
import { submitBook } from "@/lib/content-store";
import { MAX_TXT_BYTES, parseTxt } from "@/lib/import-txt";
import { languages, type Locale } from "@/i18n/messages";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  const reader = request.body?.getReader();
  if (!reader)
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  let title: string, author: string, genre: string, locale: Locale, content;
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_TXT_BYTES * 6 + 4096) {
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
    if (typeof body.text !== "string")
      throw new Error("Falta el texto del libro.");
    title = body.title.trim();
    author = body.author.trim();
    genre = body.genre;
    locale = body.locale;
    content = parseTxt(body.text, title);
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
