import { messages, type Locale } from "@/i18n/messages";
const lorem =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
export type StoryTranslation = {
  title: string;
  pages: { number: number; chapter: string; paragraphs: string[] }[];
};
export type Story = {
  slug: string;
  title: string;
  genre: string;
  author: string;
  originalLocale?: Locale;
  translations: Partial<Record<Locale, StoryTranslation>>;
};
function mockTranslation(locale: Locale, title: string): StoryTranslation {
  return {
    title,
    pages: Array.from({ length: 50 }, (_, i) => ({
      number: i + 1,
      chapter: `${messages[locale].chapter} ${Math.floor(i / 10) + 1}`,
      paragraphs: Array.from({ length: 4 }, () => lorem),
    })),
  };
}
export const stories: Story[] = [
  {
    slug: "donde-duermen-los-bosques",
    title: "Donde duermen los bosques",
    genre: "fantasy",
    author: "J. López",
    translations: {
      es: mockTranslation("es", "Donde duermen los bosques"),
      ca: mockTranslation("ca", "On dormen els boscos"),
      en: mockTranslation("en", "Where the Forests Sleep"),
    },
  },
];
export function getStory(slug: string) {
  return stories.find((story) => story.slug === slug);
}
export function localizeStory(story: Story, locale: Locale) {
  const contentLocale = story.translations[locale]
    ? locale
    : (story.originalLocale ?? "es");
  return { ...story, ...story.translations[contentLocale]!, contentLocale };
}
// La misma página se conserva al cambiar de idioma; mantén la paginación alineada entre traducciones.
export const progressKey = (slug: string) => `lumbre-page:${slug}`;
