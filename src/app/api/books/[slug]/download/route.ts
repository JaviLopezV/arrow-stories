import { localizeStory } from "@/content/stories";
import { getStoredStory } from "@/lib/content-store";
import { bookAsText } from "@/lib/book-download";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  if (format !== "txt") {
    return new Response(null, { status: 400 });
  }

  const { slug } = await params;
  const source = await getStoredStory(slug);
  if (!source) return new Response(null, { status: 404 });

  const lang = searchParams.get("lang");
  const locale =
    lang === "es" || lang === "ca" || lang === "en"
      ? lang
      : (source.originalLocale ?? "es");
  const book = localizeStory(source, locale);
  return new Response(bookAsText(book), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${book.slug}-${book.contentLocale}.${format}"`,
      "Content-Language": book.contentLocale,
      "Cache-Control": "no-store",
    },
  });
}
