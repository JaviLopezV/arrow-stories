import type { localizeStory } from "@/content/stories";

type Book = ReturnType<typeof localizeStory>;

function bookSections(book: Book) {
  const sections = [{ heading: book.title, paragraphs: [book.author] }];
  if (book.source) {
    sections[0].paragraphs.push(
      [book.source, book.credit].filter(Boolean).join(" · "),
    );
  }

  let previousChapter = book.title;
  for (const page of book.pages) {
    sections.push({
      heading: page.chapter === previousChapter ? "" : page.chapter,
      paragraphs: page.paragraphs,
    });
    previousChapter = page.chapter;
  }

  return sections;
}

export function bookAsText(book: Book) {
  return (
    bookSections(book)
      .flatMap(({ heading, paragraphs }) =>
        heading ? [heading, ...paragraphs] : paragraphs,
      )
      .join("\n\n") + "\n"
  );
}
