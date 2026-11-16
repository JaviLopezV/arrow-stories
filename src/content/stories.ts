import type { Locale } from "@/i18n/messages";
export type StoryTranslation = {
  title: string;
  source?: string;
  credit?: string;
  pages: { number: number; chapter: string; paragraphs: string[] }[];
};
export type Story = {
  slug: string;
  title: string;
  genre: string;
  author: string;
  cover?: string;
  source?: string;
  collection?: string;
  originalLocale?: Locale;
  translations: Partial<Record<Locale, StoryTranslation>>;
};
export function localizeStory(story: Story, locale: Locale) {
  const contentLocale = story.translations[locale]
    ? locale
    : (story.originalLocale ?? "es");
  return { ...story, ...story.translations[contentLocale]!, contentLocale };
}
// La misma página se conserva al cambiar de idioma; mantén la paginación alineada entre traducciones.
export const progressKey = (slug: string) => `lumbre-page:${slug}`;
