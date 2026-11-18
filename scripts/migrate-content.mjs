import { neon } from "@neondatabase/serverless";
import { get, list } from "@vercel/blob";
import nextEnv from "@next/env";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const prefix = "content/";
const schemaUrl = new URL("./content-schema.sql", import.meta.url);

async function* blobRecords(token) {
  let cursor;
  do {
    const page = await list({ prefix, token, cursor });
    for (const blob of page.blobs) {
      const result = await get(blob.pathname, {
        access: "private",
        token,
        useCache: false,
      });
      if (result?.statusCode !== 200) {
        throw new Error(`No se pudo leer ${blob.pathname}.`);
      }
      yield [
        blob.pathname.slice(prefix.length),
        await new Response(result.stream).text(),
      ];
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}

async function* localRecords(root, directory = "") {
  const entries = await readdir(path.join(root, directory), {
    withFileTypes: true,
  });
  for (const entry of entries) {
    const key = path.posix.join(directory, entry.name);
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      yield* localRecords(root, key);
    } else if (entry.isFile() && !key.endsWith(".tmp")) {
      const body = await readFile(path.join(root, key), "utf8");
      const legacy =
        /^requests\/(pending|rejected)\/([a-z0-9-]{1,160}\.json)$/.exec(key);
      if (legacy) {
        yield [
          `requests/submissions/${legacy[2]}`,
          JSON.stringify({ story: JSON.parse(body), status: legacy[1] }),
        ];
      } else {
        yield [key, body];
      }
    }
  }
}

async function main() {
  const [source, ...extra] = process.argv.slice(2);
  if (!["schema", "blob", "local"].includes(source) || extra.length) {
    throw new Error("Uso: npm run migrate:content -- schema|blob|local");
  }

  const { DATABASE_URL: url, BLOB_READ_WRITE_TOKEN: token } = process.env;
  if (!url) throw new Error("Falta DATABASE_URL.");
  if (source === "blob" && !token) {
    throw new Error("Falta BLOB_READ_WRITE_TOKEN para leer el origen.");
  }

  const sql = neon(url);
  await sql.query(await readFile(schemaUrl, "utf8"));
  if (source === "schema") {
    console.log("Esquema de contenido preparado.");
    return;
  }

  const records =
    source === "blob"
      ? blobRecords(token)
      : localRecords(
          process.env.CONTENT_DIRECTORY || path.join("data", "content"),
        );

  let imported = 0;
  let identical = 0;
  for await (const [key, body] of records) {
    if (!key) throw new Error("Se encontró una ruta vacía en el origen.");
    if (key.endsWith(".json")) {
      try {
        JSON.parse(body);
      } catch {
        throw new Error(`JSON inválido en ${key}.`);
      }
    }

    const inserted = await sql`
      INSERT INTO story_content (key, body) VALUES (${key}, ${body})
      ON CONFLICT (key) DO NOTHING
      RETURNING key
    `;
    const [record] = await sql`
      SELECT body = ${body} AS matches FROM story_content WHERE key = ${key}
    `;
    if (!record?.matches) {
      throw new Error(
        `El contenido de ${key} difiere en Neon. Se conservó el destino.`,
      );
    }
    if (inserted.length) imported++;
    else identical++;
  }
  console.log(
    `Origen ${source}: ${imported} registros importados y ${identical} idénticos.`,
  );
}

try {
  await main();
} catch (error) {
  // Provider exceptions can include credentials or response data.
  const message =
    error.constructor === Error && !error.cause ? error.message : error.name;
  console.error(
    `Error de migración (${message}). Puedes reintentar la importación.`,
  );
  process.exitCode = 1;
}
