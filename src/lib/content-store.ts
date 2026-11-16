import "server-only";
import {
  mkdir,
  readFile,
  writeFile,
  rename,
  unlink,
  readdir,
} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Locale } from "@/i18n/messages";
import type { Story, StoryTranslation } from "@/content/stories";
import { stories } from "@/content/built-in-stories";
const directory = () =>
  process.env.CONTENT_DIRECTORY || path.join(process.cwd(), "data", "content");
const filename = (slug: string, locale: Locale) =>
  path.join(directory(), `${slug}.${locale}.json`);
export async function readPublished(
  slug: string,
  locale: Locale,
): Promise<StoryTranslation | null> {
  try {
    return JSON.parse(await readFile(filename(slug, locale), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
export async function publish(
  slug: string,
  locale: Locale,
  content: StoryTranslation,
) {
  await mkdir(directory(), { recursive: true });
  const target = filename(slug, locale),
    temp = `${target}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(content), { mode: 0o600 });
  await rename(temp, target);
}
export async function restore(slug: string, locale: Locale) {
  try {
    await unlink(filename(slug, locale));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

const booksDirectory = () => path.join(directory(), "books");
const pendingDirectory = () => path.join(directory(), "requests", "pending");
export async function submitBook(story: Story) {
  await mkdir(pendingDirectory(), { recursive: true, mode: 0o700 });
  const target = path.join(pendingDirectory(), `${story.slug}.json`);
  const temp = `${target}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(story), { mode: 0o600, flag: "wx" });
  await rename(temp, target);
}
const editsDirectory = () => path.join(directory(), "edits");
export async function saveBookEdit(story: Story) {
  await mkdir(editsDirectory(), { recursive: true, mode: 0o700 });
  const target = path.join(editsDirectory(), `${story.slug}.json`);
  const temp = `${target}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(story), { mode: 0o600, flag: "wx" });
  await rename(temp, target);
}
export async function getStoredStory(
  slug: string,
  includeHidden = false,
): Promise<Story | undefined> {
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return undefined;
  if (!includeHidden && (await bookStatus(slug)) !== "active") return undefined;
  let story = stories.find((s) => s.slug === slug);
  if (!story) {
    try {
      story = JSON.parse(
        await readFile(path.join(booksDirectory(), `${slug}.json`), "utf8"),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    }
  }
  if (!story) return undefined;
  try {
    const edited: Story = JSON.parse(
      await readFile(path.join(editsDirectory(), `${slug}.json`), "utf8"),
    );
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
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const translations = { ...story.translations };
  for (const locale of ["es", "ca", "en"] as Locale[]) {
    const content = await readPublished(slug, locale);
    if (content) translations[locale] = content;
  }
  return { ...story, translations };
}
export async function listStories(includeHidden = false): Promise<Story[]> {
  let filenames: string[];
  try {
    filenames = await readdir(booksDirectory());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") filenames = [];
    else throw error;
  }
  const slugs = [
    ...stories.map((s) => s.slug),
    ...filenames
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => f.slice(0, -5)),
  ];
  const result = await Promise.all(
    slugs.map((slug) => getStoredStory(slug, includeHidden)),
  );
  return result.filter((story): story is Story => Boolean(story));
}

export async function listPendingBooks() {
  try {
    return (await readdir(pendingDirectory()))
      .filter((name) => name.endsWith(".json"))
      .sort()
      .map((name) => name.slice(0, -5));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
export async function getPendingBook(slug: string): Promise<Story | null> {
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return null;
  try {
    return JSON.parse(
      await readFile(path.join(pendingDirectory(), `${slug}.json`), "utf8"),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
export async function reviewBook(slug: string, approve: boolean) {
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return false;
  const destination = approve
    ? booksDirectory()
    : path.join(directory(), "requests", "rejected");
  await mkdir(destination, { recursive: true, mode: 0o700 });
  try {
    await rename(
      path.join(pendingDirectory(), `${slug}.json`),
      path.join(destination, `${slug}.json`),
    );
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

const statusDirectory = () => path.join(directory(), "status");
export type BookStatus = "active" | "inactive" | "deleted";
export async function bookStatus(slug: string): Promise<BookStatus> {
  try {
    await readFile(path.join(statusDirectory(), `${slug}.deleted`));
    return "deleted";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  try {
    const status = await readFile(
      path.join(statusDirectory(), `${slug}.txt`),
      "utf8",
    );
    return status === "deleted" ? "deleted" : "inactive";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "active";
    throw error;
  }
}
export async function manageBook(
  slug: string,
  action: "activate" | "deactivate" | "delete",
) {
  const story = await getStoredStory(slug, true);
  if (!story || (await bookStatus(slug)) === "deleted") return false;
  const target = path.join(
    statusDirectory(),
    action === "delete" ? `${slug}.deleted` : `${slug}.txt`,
  );
  if (action === "activate") {
    await unlink(target).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  } else {
    await mkdir(statusDirectory(), { recursive: true, mode: 0o700 });
    const temp = `${target}.${randomUUID()}.tmp`;
    await writeFile(temp, action === "delete" ? "deleted" : "inactive", {
      mode: 0o600,
    });
    await rename(temp, target);
  }
  return true;
}
