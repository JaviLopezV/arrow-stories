export const genreCover = {
  fantasy: "forest",
  mystery: "city",
  romance: "moon",
  drama: "summer",
  adventure: "forest",
  scienceFiction: "moon",
  horror: "forest",
  thriller: "city",
  historicalFiction: "summer",
  comedy: "summer",
  childrens: "forest",
  youngAdult: "moon",
  poetry: "moon",
  biography: "summer",
  essay: "city",
  nonfiction: "city",
  historyAndPolitics: "city",
} as const;

export type Genre = keyof typeof genreCover;
export const genres = Object.keys(genreCover) as Genre[];

export function isGenre(value: unknown): value is Genre {
  return typeof value === "string" && Object.hasOwn(genreCover, value);
}
