"use client";
import { useMemo, useState } from "react";
import { COVER_ACCEPT, MAX_COVER_BYTES } from "@/lib/book-cover";
import { MAX_TXT_BYTES, parseTxt } from "@/lib/import-txt";
import { localizeStory, type Story } from "@/content/stories";
import { languages, type Locale } from "@/i18n/messages";

export default function BookForm({
  book,
  token,
  onSave,
  onCancel,
}: {
  book?: Story;
  token?: string;
  onSave: (result: { title: string; author: string; slug: string }) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [genre, setGenre] = useState(book?.genre ?? "fantasy");
  const [locale, setLocale] = useState<Locale>(book?.originalLocale ?? "es");
  const [cover, setCover] = useState(book?.cover ?? "");
  const [upload, setUpload] = useState<{ text: string; name: string }>();
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = useMemo(
    () =>
      upload
        ? parseTxt(upload.text, "")
        : book && localizeStory(book, book.originalLocale ?? "es"),
    [upload, book],
  );
  const current = preview?.pages[page];

  async function pick(input: HTMLInputElement, image: boolean) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      if (image) {
        if (
          !COVER_ACCEPT.split(",").includes(file.type) ||
          file.size > MAX_COVER_BYTES
        )
          throw new Error("Elige una imagen JPG, PNG o WebP de hasta 1 MB.");
        const value = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () =>
            reject(new Error("No se pudo leer la imagen."));
          reader.readAsDataURL(file);
        });
        const picture = new Image();
        picture.src = value;
        await picture.decode();
        setCover(value);
      } else {
        if (!/\.txt$/i.test(file.name) || file.size > MAX_TXT_BYTES)
          throw new Error("Elige un archivo TXT de hasta 2 MB.");
        const text = new TextDecoder("utf-8", { fatal: true }).decode(
          await file.arrayBuffer(),
        );
        parseTxt(text, title);
        if (!title.trim())
          setTitle(file.name.slice(0, -4).replace(/[-_]/g, " ").slice(0, 160));
        setUpload({ text, name: file.name });
        setPage(0);
      }
    } catch (e) {
      setError(
        e instanceof TypeError
          ? "El TXT debe estar en UTF-8."
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if ((!book && !upload) || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        book
          ? `/api/books/?slug=${encodeURIComponent(book.slug)}`
          : "/api/books/",
        {
          method: book ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title,
            author,
            genre,
            locale,
            text: upload?.text,
            cover: cover === book?.cover ? undefined : cover,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "No se pudo guardar el libro.");
      onSave({ ...result, author: author.trim() });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="book-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <fieldset disabled={busy}>
        <div className="book-form-grid">
          <div className="book-form-main">
            <section className="admin-panel">
              <p className="eyebrow">01 · FICHA</p>
              <h2>Datos del libro</h2>
              <div className="book-fields">
                <label>
                  Título
                  <input
                    required
                    maxLength={160}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label>
                  Autor
                  <input
                    required
                    maxLength={120}
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </label>
                <label>
                  Género
                  <select
                    value={genre}
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
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as Locale)}
                  >
                    {Object.entries(languages).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
            <section className="admin-panel">
              <p className="eyebrow">02 · MANUSCRITO</p>
              <h2>{book ? "Texto del libro" : "Adjunta el cuento"}</h2>
              <p>
                {book
                  ? "Si no adjuntas un TXT nuevo, se conserva el texto actual."
                  : "Usa un TXT en UTF-8 de hasta 2 MB."}
              </p>
              <label className="book-upload">
                {book ? "Reemplazar texto (opcional)" : "Archivo TXT"}
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={(e) => void pick(e.currentTarget, false)}
                />
              </label>
              {upload && (
                <div className="book-actions">
                  <span>{upload.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUpload(undefined);
                      setPage(0);
                    }}
                  >
                    Quitar TXT
                  </button>
                </div>
              )}
              <details>
                <summary>Formato del TXT</summary>
                <p>
                  Separa los párrafos con una línea en blanco. Para abrir un
                  capítulo, escribe # seguido de un espacio y el título.
                </p>
                <a download href="/plantilla-libro.txt">
                  Descargar plantilla ↓
                </a>
              </details>
            </section>
          </div>
          <section className="admin-panel book-cover-panel">
            <p className="eyebrow">03 · PORTADA</p>
            <h2>Imagen opcional</h2>
            {cover ? (
              <img
                className="cover-preview"
                src={cover}
                alt="Vista previa de la portada"
              />
            ) : (
              <div className="book-cover-placeholder">Portada por género</div>
            )}
            <label>
              {cover ? "Cambiar portada" : "Subir portada"}
              <input
                type="file"
                accept={COVER_ACCEPT}
                onChange={(e) => void pick(e.currentTarget, true)}
              />
            </label>
            <p>JPG, PNG o WebP, hasta 1 MB. Mejor en vertical.</p>
            {cover && (
              <button type="button" onClick={() => setCover("")}>
                Quitar portada
              </button>
            )}
          </section>
        </div>
        {preview && current && (
          <details className="admin-panel book-preview" open>
            <summary>Vista previa · {preview.pages.length} páginas</summary>
            <label>
              Página
              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
              >
                {preview.pages.map((item, index) => (
                  <option key={item.number} value={index}>
                    {item.number} · {item.chapter}
                  </option>
                ))}
              </select>
            </label>
            <article className="admin-preview" lang={locale}>
              <h3>{current.chapter}</h3>
              {current.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </article>
          </details>
        )}
        <div className="book-form-footer">
          <p role="status">
            {error ||
              (busy
                ? "Procesando…"
                : book
                  ? "Se mantiene el enlace del libro y su estado actual."
                  : "El cuento aparecerá en la biblioteca si se aprueba.")}
          </p>
          <div className="book-actions">
            {onCancel && (
              <button type="button" onClick={onCancel}>
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="button primary"
              disabled={!title.trim() || !author.trim() || (!book && !upload)}
            >
              {book ? "Guardar cambios" : "Enviar para revisión"}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
