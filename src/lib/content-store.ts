import "server-only";
import { BlobPreconditionFailedError } from "@vercel/blob";
import type { Locale } from "@/i18n/messages";
import type { Story, StoryTranslation } from "@/content/stories";
import { stories } from "@/content/built-in-stories";
import {
  deleteContentFile,
  listContentFiles,
  moveLocalContentFile,
  readBlobFile,
  readContentFile,
  usesBlob,
  writeContentFile,
} from "@/lib/content-files";

const validSlug = (slug: string) => /^[a-z0-9-]{1,160}$/.test(slug);
const translationKey = (slug: string, locale: Locale) =>
  `${slug}.${locale}.json`;
const pendingKey = (slug: string) => `requests/pending/${slug}.json`;
const submissionDirectory = "requests/submissions";
const submissionKey = (slug: string) => `${submissionDirectory}/${slug}.json`;

type Submission = {
  story: Story;
  status: "pending" | "approved" | "rejected";
  acceptance?: { version: string; acceptedAt: string };
};

async function readJson<T>(key: string): Promise<T | null> {
  const text = await readContentFile(key);
  return text === null ? null : JSON.parse(text);
}

async function listSlugs(directory: string) {
  return (await listContentFiles(directory))
    .filter((name) => name.endsWith(".json") && validSlug(name.slice(0, -5)))
    .sort()
    .map((name) => name.slice(0, -5));
}

export async function readPublished(slug: string, locale: Locale) {
  return readJson<StoryTranslation>(translationKey(slug, locale));
}

export async function publish(
  slug: string,
  locale: Locale,
  content: StoryTranslation,
) {
  await writeContentFile(translationKey(slug, locale), JSON.stringify(content));
}

export async function restore(slug: string, locale: Locale) {
  await deleteContentFile(translationKey(slug, locale));
}

export async function submitBook(story: Story, termsVersion: string) {
  if (usesBlob()) {
    const submission: Submission = {
      story,
      status: "pending",
      acceptance: {
        version: termsVersion,
        acceptedAt: new Date().toISOString(),
      },
    };
    await writeContentFile(
      submissionKey(story.slug),
      JSON.stringify(submission),
      { create: true },
    );
    return;
  }
  await writeContentFile(pendingKey(story.slug), JSON.stringify(story));
}

export async function saveBookEdit(story: Story) {
  await writeContentFile(`edits/${story.slug}.json`, JSON.stringify(story));
}

export async function getStoredStory(
  slug: string,
  includeHidden = false,
): Promise<Story | undefined> {
  if (!validSlug(slug)) return undefined;
  if (!includeHidden && (await bookStatus(slug)) !== "active") return undefined;

  let story =
    stories.find((s) => s.slug === slug) ??
    (await readJson<Story>(`books/${slug}.json`));
  if (!story && usesBlob()) {
    const submission = await readJson<Submission>(submissionKey(slug));
    if (submission?.status === "approved") story = submission.story;
  }
  if (!story) return undefined;
  const edited = await readJson<Story>(`edits/${slug}.json`);
  if (edited) {
    // Older edits can contain only the original language even when the text was not replaced.
    const original = story.translations.es;
    const editedOriginal = edited.translations.es;
    if (
      story.source &&
      edited.source === story.source &&
      (edited.originalLocale ?? "es") === "es" &&
      original &&
      editedOriginal &&
      JSON.stringify(editedOriginal.pages) === JSON.stringify(original.pages)
    ) {
      return {
        ...edited,
        translations: { ...story.translations, ...edited.translations },
      };
    }
    return edited;
  }
  const translations = { ...story.translations };
  for (const locale of ["es", "ca", "en"] as Locale[]) {
    const content = await readPublished(slug, locale);
    if (content) translations[locale] = content;
  }
  return { ...story, translations };
}
export async function listStories(includeHidden = false): Promise<Story[]> {
  const [books, submissions] = await Promise.all([
    listSlugs("books"),
    usesBlob() ? listSlugs(submissionDirectory) : [],
  ]);
  const slugs = new Set([
    ...stories.map((story) => story.slug),
    ...books,
    ...submissions,
  ]);
  const result = await Promise.all(
    [...slugs].map((slug) => getStoredStory(slug, includeHidden)),
  );
  return result.filter((story): story is Story => Boolean(story));
}

export async function listPendingBooks() {
  return listSlugs(usesBlob() ? submissionDirectory : "requests/pending");
}

export async function getPendingBook(slug: string): Promise<Story | null> {
  if (!validSlug(slug)) return null;
  if (!usesBlob()) return readJson<Story>(pendingKey(slug));
  const submission = await readJson<Submission>(submissionKey(slug));
  return submission?.status === "pending" ? submission.story : null;
}

export async function reviewBook(slug: string, approve: boolean) {
  if (!validSlug(slug)) return false;
  if (!usesBlob()) {
    const destination = approve ? "books" : "requests/rejected";
    return moveLocalContentFile(
      pendingKey(slug),
      `${destination}/${slug}.json`,
    );
  }

  // The decision and manuscript are committed together, even if requests race.
  const key = submissionKey(slug);
  const stored = await readBlobFile(key);
  if (!stored) return false;
  const submission: Submission = JSON.parse(stored.text);
  if (submission.status !== "pending") return false;
  submission.status = approve ? "approved" : "rejected";
  try {
    await writeContentFile(key, JSON.stringify(submission), {
      ifMatch: stored.etag,
    });
    return true;
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) return false;
    throw error;
  }
}

export type BookStatus = "active" | "inactive" | "deleted";
export async function bookStatus(slug: string): Promise<BookStatus> {
  const [deleted, status] = await Promise.all([
    readContentFile(`status/${slug}.deleted`),
    readContentFile(`status/${slug}.txt`),
  ]);
  if (deleted !== null || status === "deleted") return "deleted";
  return status === null ? "active" : "inactive";
}

export async function manageBook(
  slug: string,
  action: "activate" | "deactivate" | "delete",
) {
  const story = await getStoredStory(slug, true);
  if (!story || (await bookStatus(slug)) === "deleted") return false;
  if (action === "activate") {
    await deleteContentFile(`status/${slug}.txt`);
  } else if (action === "delete") {
    await writeContentFile(`status/${slug}.deleted`, "deleted");
  } else {
    await writeContentFile(`status/${slug}.txt`, "inactive");
  }
  return true;
}
