import { NextRequest, NextResponse } from "next/server";
import { authorized, sameOrigin } from "@/lib/admin-auth";
import { getStory } from "@/content/stories";
import { languages, type Locale } from "@/i18n/messages";
import { parseTxt, MAX_TXT_BYTES } from "@/lib/import-txt";
import { publish, readPublished, restore } from "@/lib/content-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function selection(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") || "";
  const locale = request.nextUrl.searchParams.get("locale") || "";
  const story = getStory(slug);
  if (!story || !Object.hasOwn(languages, locale)) return null;
  return { slug, locale: locale as Locale, story };
}
export async function GET(request: NextRequest) {
  const selected = selection(request);
  if (!selected)
    return NextResponse.json(
      { error: "Libro o idioma no válido." },
      { status: 400 },
    );
  const content = await readPublished(selected.slug, selected.locale);
  return NextResponse.json(
    { content },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: NextRequest) {
  if (!authorized(request))
    return NextResponse.json(
      {
        error:
          "Acceso no autorizado. Configura una clave de administrador de al menos 32 caracteres en el servidor.",
      },
      { status: 401 },
    );
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  const selected = selection(request);
  if (!selected)
    return NextResponse.json(
      { error: "Libro o idioma no válido." },
      { status: 400 },
    );
  const reader = request.body?.getReader();
  if (!reader)
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_TXT_BYTES) {
        await reader.cancel();
        return NextResponse.json(
          { error: "El archivo supera los 2 MB." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.concat(chunks),
    );
    const content = parseTxt(
      text,
      selected.story.translations[selected.locale]?.title ||
        selected.story.title,
    );
    await publish(selected.slug, selected.locale, content);
    return NextResponse.json({ pages: content.pages.length });
  } catch {
    return NextResponse.json(
      {
        error:
          "No se pudo publicar. Comprueba el TXT UTF-8 y el almacenamiento del servidor.",
      },
      { status: 400 },
    );
  }
}
export async function DELETE(request: NextRequest) {
  if (!authorized(request))
    return NextResponse.json(
      { error: "Acceso no autorizado." },
      { status: 401 },
    );
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  const selected = selection(request);
  if (!selected)
    return NextResponse.json(
      { error: "Libro o idioma no válido." },
      { status: 400 },
    );
  await restore(selected.slug, selected.locale);
  return NextResponse.json({ restored: true });
}
