import "server-only";
import { del, get, list, put } from "@vercel/blob";
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

const prefix = "content/";
const localPath = (key: string) =>
  path.join(
    process.env.CONTENT_DIRECTORY ||
      path.join(process.cwd(), "data", "content"),
    key,
  );

export const usesBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export class ContentStorageNotConfiguredError extends Error {
  constructor() {
    super("Falta conectar un almacén privado de Vercel Blob al proyecto.");
  }
}

export function checkContentStorage() {
  if (process.env.VERCEL === "1" && !usesBlob()) {
    throw new ContentStorageNotConfiguredError();
  }
}

function missing(error: unknown) {
  return (error as NodeJS.ErrnoException).code === "ENOENT";
}

export async function readBlobFile(key: string, forConditionalWrite = false) {
  const result = await get(prefix + key, {
    access: "private",
    useCache: false,
    // Compression can turn the response ETag into a weak validator.
    headers: forConditionalWrite
      ? { "Accept-Encoding": "identity" }
      : undefined,
  });
  if (result?.statusCode !== 200) return null;
  const etag = result.blob.etag;
  if (forConditionalWrite && (!etag || etag.startsWith("W/"))) {
    await result.stream.cancel();
    throw new Error(
      "Vercel Blob no devolvió un ETag válido para actualizar el archivo.",
    );
  }
  return {
    text: await new Response(result.stream).text(),
    etag,
  };
}

export async function readContentFile(key: string) {
  if (usesBlob()) return (await readBlobFile(key))?.text ?? null;
  try {
    return await readFile(localPath(key), "utf8");
  } catch (error) {
    if (!missing(error)) throw error;
    return null;
  }
}

export async function listContentFiles(directory: string) {
  if (usesBlob()) {
    const directoryPrefix = prefix + directory + "/";
    const names: string[] = [];
    let cursor: string | undefined;
    do {
      const result = await list({ prefix: directoryPrefix, cursor });
      names.push(
        ...result.blobs.map((blob) =>
          blob.pathname.slice(directoryPrefix.length),
        ),
      );
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);
    return names.filter((name) => !name.includes("/"));
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
  options: { create?: boolean; ifMatch?: string } = {},
) {
  checkContentStorage();
  if (usesBlob()) {
    await put(prefix + key, text, {
      access: "private",
      allowOverwrite: !options.create,
      ifMatch: options.ifMatch,
      multipart: Buffer.byteLength(text) > 4 * 1024 * 1024,
    });
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
  if (usesBlob()) {
    await del(prefix + key);
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
