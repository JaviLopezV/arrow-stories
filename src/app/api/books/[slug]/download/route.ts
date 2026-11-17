import { localizeStory } from "@/content/stories";
import { getStoredStory } from "@/lib/content-store";
import { bookAsPdf, bookAsText } from "@/lib/book-download";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  if (format !== "txt" && format !== "pdf") {
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
  const body =
    format === "pdf" ? new Uint8Array(await bookAsPdf(book)) : bookAsText(book);

  return new Response(body, {
    headers: {
      "Content-Type":
        format === "pdf" ? "application/pdf" : "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${book.slug}-${book.contentLocale}.${format}"`,
      "Content-Language": book.contentLocale,
      "Cache-Control": "no-store",
    },
  });
}
