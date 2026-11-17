import {
  Document,
  Font,
  Page,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { localizeStory } from "@/content/stories";
import regularFont from "./pdf-fonts/DejaVuSerif.ttf";
import boldFont from "./pdf-fonts/DejaVuSerif-Bold.ttf";

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

Font.register({
  family: "DejaVu Serif",
  fonts: [{ src: regularFont }, { src: boldFont, fontWeight: 700 }],
});

const styles = StyleSheet.create({
  page: {
    padding: 54,
    fontFamily: "DejaVu Serif",
    fontSize: 12,
    lineHeight: 1.4,
  },
  title: { fontWeight: 700, fontSize: 25, marginBottom: 10 },
  chapter: {
    fontWeight: 700,
    fontSize: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  paragraph: { marginBottom: 9 },
});

export function bookAsPdf(book: Book) {
  return renderToBuffer(
    <Document
      title={book.title}
      author={book.author}
      language={book.contentLocale}
    >
      <Page size="A4" style={styles.page}>
        {bookSections(book).map(({ heading, paragraphs }, index) => (
          <TextSection
            key={index}
            heading={heading}
            paragraphs={paragraphs}
            title={index === 0}
          />
        ))}
      </Page>
    </Document>,
  );
}

function TextSection({
  heading,
  paragraphs,
  title,
}: {
  heading: string;
  paragraphs: string[];
  title: boolean;
}) {
  return (
    <>
      {heading && (
        <Text
          style={title ? styles.title : styles.chapter}
          minPresenceAhead={30}
        >
          {heading}
        </Text>
      )}
      {paragraphs.map((paragraph, index) => (
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
    </>
  );
}
