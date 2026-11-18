import "server-only";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const localPath = (key: string) =>
  path.join(
    process.env.CONTENT_DIRECTORY ||
      path.join(process.cwd(), "data", "content"),
    key,
  );

export const usesDatabase = () => Boolean(process.env.DATABASE_URL);

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new ContentStorageNotConfiguredError();
  return neon(url);
}

export class ContentStorageNotConfiguredError extends Error {
  constructor() {
    super("Falta configurar DATABASE_URL para conectar el proyecto a Neon.");
  }
}

export function checkContentStorage() {
  if (process.env.VERCEL === "1" && !usesDatabase()) {
    throw new ContentStorageNotConfiguredError();
  }
}

function missing(error: unknown) {
  return (error as NodeJS.ErrnoException).code === "ENOENT";
}

export async function readContentFile(key: string) {
  checkContentStorage();
  if (usesDatabase()) {
    const sql = database();
    const [row] = await sql`SELECT body FROM story_content WHERE key = ${key}`;
    return (row?.body as string | undefined) ?? null;
  }
  try {
    return await readFile(localPath(key), "utf8");
  } catch (error) {
    if (!missing(error)) throw error;
    return null;
  }
}

export async function listContentFiles(directory: string) {
  checkContentStorage();
  if (usesDatabase()) {
    const sql = database();
    const prefix = directory + "/";
    const rows = await sql`
      SELECT substr(key, length(${prefix}) + 1) AS name
      FROM story_content
      WHERE key LIKE ${prefix + "%"}
        AND strpos(substr(key, length(${prefix}) + 1), '/') = 0
      ORDER BY key
    `;
    return rows.map((row) => row.name as string);
  }
  try {
    return await readdir(localPath(directory));
  } catch (error) {
    if (!missing(error)) throw error;
    return [];
  }
}

export async function writeContentFile(
  key: string,
  text: string,
  options: { create?: boolean } = {},
) {
  checkContentStorage();
  if (usesDatabase()) {
    const sql = database();
    if (options.create) {
      await sql`INSERT INTO story_content (key, body) VALUES (${key}, ${text})`;
    } else {
      await sql`
        INSERT INTO story_content (key, body) VALUES (${key}, ${text})
        ON CONFLICT (key) DO UPDATE SET body = EXCLUDED.body
      `;
    }
    return;
  }
  const target = localPath(key);
  const temporary = `${target}.${randomUUID()}.tmp`;
  await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  await writeFile(temporary, text, { mode: 0o600, flag: "wx" });
  await rename(temporary, target);
}

export async function deleteContentFile(key: string) {
  checkContentStorage();
  if (usesDatabase()) {
    const sql = database();
    await sql`DELETE FROM story_content WHERE key = ${key}`;
    return;
  }
  try {
    await unlink(localPath(key));
  } catch (error) {
    if (!missing(error)) throw error;
  }
}

export async function moveLocalContentFile(from: string, to: string) {
  checkContentStorage();
  const destination = localPath(to);
  await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
  try {
    await rename(localPath(from), destination);
    return true;
  } catch (error) {
    if (!missing(error)) throw error;
    return false;
  }
}

export async function updateContentFileIfUnchanged(
  key: string,
  previous: string,
  next: string,
) {
  const sql = database();
  const rows = await sql`
    UPDATE story_content SET body = ${next}
    WHERE key = ${key} AND body = ${previous}
    RETURNING key
  `;
  return rows.length > 0;
}
