import type { StoryTranslation } from "@/content/stories";
import { messages, type Locale } from "@/i18n/messages";
export const MAX_TXT_BYTES = 2 * 1024 * 1024;
export function parseTxt(
  text: string,
  title: string,
  locale: Locale = "es",
): StoryTranslation {
  if (new TextEncoder().encode(text).length > MAX_TXT_BYTES)
    throw new Error("El archivo supera los 2 MB.");
  text = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .trim();
  if (!text || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text))
    throw new Error("El archivo debe contener texto plano UTF-8 válido.");
  const pages: StoryTranslation["pages"] = [];
  let chapter = `${messages[locale].chapter} 1`,
    paragraphs: string[] = [],
    words = 0,
    buffer: string[] = [];
  const flushPage = () => {
    if (paragraphs.length)
      pages.push({ number: pages.length + 1, chapter, paragraphs });
    paragraphs = [];
    words = 0;
  };
  const flushParagraph = () => {
    const paragraph = buffer.join(" ").trim();
    buffer = [];
    if (!paragraph) return;
    const tokens = paragraph.split(/\s+/);
    if (words && words + tokens.length > 350) flushPage();
    if (tokens.length > 350) {
      for (let i = 0; i < tokens.length; i += 350) {
        paragraphs.push(tokens.slice(i, i + 350).join(" "));
        words = Math.min(350, tokens.length - i);
        if (words === 350) flushPage();
      }
    } else {
      paragraphs.push(paragraph);
      words += tokens.length;
    }
  };
  for (const line of text.split("\n")) {
    if (/^#\s+/.test(line)) {
      flushParagraph();
      flushPage();
      chapter = line.replace(/^#\s+/, "").trim();
    } else if (!line.trim()) flushParagraph();
    else buffer.push(line.trim());
  }
  flushParagraph();
  flushPage();
  if (!pages.length)
    throw new Error("El archivo no contiene párrafos para leer.");
  return { title, pages };
}
