import "server-only";
import type { Story, StoryTranslation } from "@/content/stories";
import { parseTxt } from "@/lib/import-txt";
import classics from "./classics.json";
import catalan from "./classics-ca.json";
import english from "./classics-en.json";

function translation({
  title,
  pages,
  ...attribution
}: {
  title: string;
  pages: string[][];
  source?: string;
  credit?: string;
}): StoryTranslation {
  return {
    title,
    ...attribution,
    pages: pages.map((paragraphs, index) => ({
      number: index + 1,
      chapter: title,
      paragraphs,
    })),
  };
}

export const stories: Story[] = classics.map(
  ({ slug, title, source, text }) => ({
    slug,
    title,
    source,
    collection: "Cuentos de la selva (1918)",
    author: "Horacio Quiroga",
    genre: "fantasy",
    originalLocale: "es",
    translations: {
      es: parseTxt(`# ${title}\n\n${text}`, title),
      ca: translation(catalan[slug as keyof typeof catalan]),
      en: translation(english[slug as keyof typeof english]),
    },
  }),
);

export function getStory(slug: string) {
  return stories.find((story) => story.slug === slug);
}
