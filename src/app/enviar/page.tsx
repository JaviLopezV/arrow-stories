"use client";
import Link from "next/link";
import { useState } from "react";
import { type StoryTranslation } from "@/content/stories";
import { languages, type Locale } from "@/i18n/messages";
import { MAX_TXT_BYTES, parseTxt } from "@/lib/import-txt";
export default function SubmitBook() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("fantasy");
  const [submitted, setSubmitted] = useState("");
  const [locale, setLocale] = useState<Locale>("es");

  const [text, setText] = useState("");
  const [preview, setPreview] = useState<StoryTranslation | null>(null);
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const reset = () => {
    setPreview(null);
    setText("");
    setPage(0);
    setNotice("");
    setSubmitted("");
    setFileKey((k) => k + 1);
  };
  async function load(file?: File) {
    setPreview(null);
    setText("");
    setNotice("");
    setPage(0);
    if (!file) return;
    setBusy(true);
    try {
      if (!file.name.toLowerCase().endsWith(".txt"))
        throw new Error("Selecciona un archivo .txt.");
      if (file.size > MAX_TXT_BYTES)
        throw new Error("El archivo supera los 2 MB.");
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
        await file.arrayBuffer(),
      );
      if (!title.trim())
        setTitle(file.name.replace(/\.txt$/i, "").replace(/[-_]/g, " "));
      setPreview(
        parseTxt(decoded, title.trim() || file.name.replace(/\.txt$/i, "")),
      );
      setText(decoded);
    } catch (error) {
      setNotice(
        error instanceof TypeError
          ? "Guarda el archivo con codificación UTF-8."
          : (error as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, author, genre, locale, text }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "No se pudo crear el libro.");
      setSubmitted(result.slug);
      setNotice(`«${result.title}» está pendiente de revisión.`);
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-page">
      <Link href="/">← Volver a la biblioteca</Link>
      <p className="eyebrow">LUMBRE · ENVÍO DE LIBROS</p>
      <h1>Enviar un libro</h1>
      <p>
        Envía tu libro para revisión. Si el administrador lo aprueba, aparecerá
        en la biblioteca.
      </p>
      <div className="admin-panel">
        <label>
          Título del libro
          <input
            maxLength={160}
            value={title}
            disabled={busy || Boolean(submitted)}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Autor
          <input
            maxLength={120}
            value={author}
            disabled={busy || Boolean(submitted)}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </label>
        <label>
          Género
          <select
            value={genre}
            disabled={busy || Boolean(submitted)}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="fantasy">Fantasía</option>
            <option value="mystery">Misterio</option>
            <option value="romance">Romance</option>
            <option value="drama">Drama</option>
          </select>
        </label>
        <label>
          Idioma del contenido
          <select
            disabled={busy || Boolean(submitted)}
            value={locale}
            onChange={(e) => {
              setLocale(e.target.value as Locale);
              reset();
            }}
          >
            {Object.entries(languages).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="admin-panel">
        <h2>Preparar el archivo</h2>
        <p>
          TXT en UTF-8, máximo 2 MB. Separa los párrafos con una línea en blanco
          y comienza cada capítulo con # seguido de un espacio y su título. Sin
          capítulos, se crea uno. Las páginas tendrán unas 350 palabras; los
          párrafos más largos se dividirán.
        </p>
        <a download="plantilla-libro.txt" href="/plantilla-libro.txt">
          Descargar plantilla TXT ↓
        </a>
        <label>
          Archivo TXT
          <input
            key={fileKey}
            disabled={busy || Boolean(submitted)}
            type="file"
            accept=".txt,text/plain"
            onChange={(e) => void load(e.target.files?.[0])}
          />
        </label>
      </div>
      {preview && !submitted && (
        <section className="admin-panel">
          <h2>Vista previa · {title || preview.title}</h2>
          <p>
            {preview.pages.length} páginas ·{" "}
            {new Set(preview.pages.map((p) => p.chapter)).size} títulos de
            capítulo · {text.trim().split(/\s+/).length} palabras
            aproximadamente.
          </p>
          <label>
            Página
            <select
              value={page}
              onChange={(e) => setPage(Number(e.target.value))}
            >
              {preview.pages.map((p, i) => (
                <option value={i} key={i}>
                  {i + 1} · {p.chapter}
                </option>
              ))}
            </select>
          </label>
          <article className="admin-preview">
            <h3>{preview.pages[page].chapter}</h3>
            {preview.pages[page].paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
          <p>
            El texto en {languages[locale]} se enviará al administrador para su
            revisión.
          </p>
          <button
            className="button primary"
            disabled={
              busy || !title.trim() || !author.trim() || Boolean(submitted)
            }
            onClick={() => void save()}
          >
            {busy ? "Guardando…" : "Enviar para revisión"}
          </button>
        </section>
      )}
      {submitted && (
        <div className="admin-panel">
          <h2>Petición recibida</h2>
          <p>
            <Link prefetch={false} href="/">
              Ver la biblioteca →
            </Link>
          </p>
          <button
            onClick={() => {
              reset();
              setTitle("");
            }}
          >
            Subir otro libro
          </button>
        </div>
      )}
      <p role="status" aria-live="polite">
        {notice}
      </p>
    </main>
  );
}
