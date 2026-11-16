"use client";
import Link from "next/link";
import { siteOwner, submissionTermsVersion } from "@/lib/legal";
import { useMemo, useState } from "react";
import { COVER_ACCEPT, MAX_COVER_BYTES } from "@/lib/book-cover";
import { MAX_TXT_BYTES, parseTxt } from "@/lib/import-txt";
import { localizeStory, type Story } from "@/content/stories";
import { languages, type Locale } from "@/i18n/messages";

type Upload = { text: string; name: string };
const localeOptions = Object.keys(languages) as Locale[];

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
  const [upload, setUpload] = useState<Upload>();
  const [multi, setMulti] = useState(false);
  const [additional, setAdditional] = useState<Locale[]>([]);
  const [uploads, setUploads] = useState<Partial<Record<Locale, Upload>>>({});
  const [previewLocale, setPreviewLocale] = useState<Locale>();
  const selected = [locale, ...additional.filter((item) => item !== locale)];
  const available = multi ? selected.filter((item) => uploads[item]) : [];
  const readingLocale =
    previewLocale && available.includes(previewLocale)
      ? previewLocale
      : (available[0] ?? locale);
  const readingUpload = multi ? uploads[readingLocale] : upload;
  const readyToSend = multi
    ? selected.length >= 2 && selected.every((item) => uploads[item])
    : Boolean(upload);
  const [page, setPage] = useState(0);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = useMemo(
    () =>
      readingUpload
        ? parseTxt(readingUpload.text, "", readingLocale)
        : book && localizeStory(book, book.originalLocale ?? "es"),
    [readingUpload, book, readingLocale],
  );
  const current =
    preview?.pages[Math.min(page, (preview?.pages.length ?? 1) - 1)];

  async function pick(
    input: HTMLInputElement,
    image: boolean,
    language?: Locale,
  ) {
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
        if (language) {
          setUploads((files) => ({
            ...files,
            [language]: { text, name: file.name },
          }));
          setPreviewLocale(language);
        } else setUpload({ text, name: file.name });
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
    if (busy || (!book && (!readyToSend || !acceptsTerms))) return;
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
            termsVersion: book ? undefined : submissionTermsVersion,
            title,
            author,
            genre,
            locale,
            text: multi ? undefined : upload?.text,
            texts: multi
              ? Object.fromEntries(
                  selected.map((item) => [item, uploads[item]?.text]),
                )
              : undefined,
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
                  {multi ? "Idioma principal" : "Idioma del contenido"}
                  <select
                    value={locale}
                    onChange={(e) => {
                      const next = e.target.value as Locale;
                      if (multi)
                        setAdditional(selected.filter((item) => item !== next));
                      setLocale(next);
                      setPage(0);
                    }}
                  >
                    {Object.entries(languages).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {!book && (
                <label className="book-multi-option">
                  <input
                    type="checkbox"
                    checked={multi}
                    onChange={(e) => {
                      setMulti(e.target.checked);
                      setPage(0);
                    }}
                  />
                  Multiidioma
                </label>
              )}
              {multi && (
                <div
                  role="group"
                  aria-label="Idiomas adicionales"
                  className="book-language-options"
                >
                  <p>Idiomas adicionales</p>
                  {localeOptions
                    .filter((item) => item !== locale)
                    .map((item) => (
                      <label key={item}>
                        <input
                          type="checkbox"
                          checked={additional.includes(item)}
                          onChange={(e) => {
                            setAdditional((items) =>
                              e.target.checked
                                ? [...items, item]
                                : items.filter((key) => key !== item),
                            );
                            setPage(0);
                          }}
                        />
                        {languages[item]}
                      </label>
                    ))}
                </div>
              )}
            </section>
            <section className="admin-panel">
              <p className="eyebrow">02 · MANUSCRITO</p>
              <h2>{book ? "Texto del libro" : "Adjunta el cuento"}</h2>
              <p>
                {book
                  ? "Si no adjuntas un TXT nuevo, se conserva el texto actual."
                  : multi
                    ? "Adjunta un TXT en UTF-8 de hasta 2 MB por cada idioma seleccionado."
                    : "Usa un TXT en UTF-8 de hasta 2 MB."}
              </p>
              {multi ? (
                <>
                  {selected.length < 2 && (
                    <p>Selecciona al menos un idioma adicional.</p>
                  )}
                  {selected.map((item) => (
                    <div key={item}>
                      <label className="book-upload">
                        TXT · {languages[item]}
                        {item === locale && " (principal)"}
                        <input
                          type="file"
                          accept=".txt,text/plain"
                          onChange={(e) =>
                            void pick(e.currentTarget, false, item)
                          }
                        />
                      </label>
                      {uploads[item] && (
                        <div className="book-actions">
                          <span>{uploads[item]?.name}</span>
                          <button
                            type="button"
                            aria-label={`Quitar TXT en ${languages[item]}`}
                            onClick={() => {
                              setUploads((files) => ({
                                ...files,
                                [item]: undefined,
                              }));
                              setPage(0);
                            }}
                          >
                            Quitar TXT
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <>
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
                </>
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
            {multi && (
              <label>
                Idioma de la vista previa
                <select
                  value={readingLocale}
                  onChange={(e) => {
                    setPreviewLocale(e.target.value as Locale);
                    setPage(0);
                  }}
                >
                  {available.map((item) => (
                    <option key={item} value={item}>
                      {languages[item]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Página
              <select
                value={Math.min(page, preview.pages.length - 1)}
                onChange={(e) => setPage(Number(e.target.value))}
              >
                {preview.pages.map((item, index) => (
                  <option key={item.number} value={index}>
                    {item.number} · {item.chapter}
                  </option>
                ))}
              </select>
            </label>
            <article
              className="admin-preview"
              lang={
                readingUpload ? readingLocale : (book?.originalLocale ?? "es")
              }
            >
              <h3>{current.chapter}</h3>
              {current.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </article>
          </details>
        )}
        {!book && (
          <div className="submission-legal" lang="es">
            <p>
              {siteOwner.name} usa los datos y archivos del envío para revisar
              la obra y publicarla si se aprueba. La revisión puede incluir un
              informe de Cloudflare Workers AI. Consulta cómo se tratan tus
              datos y cómo ejercer tus derechos en la{" "}
              <Link href="/privacidad" target="_blank" rel="noopener">
                política de privacidad (se abre en otra pestaña)
              </Link>
              .
            </p>
            <p>
              <Link href="/condiciones-de-envio" target="_blank" rel="noopener">
                Leer las condiciones de envío (se abre en otra pestaña)
              </Link>
            </p>
            <label>
              <input
                type="checkbox"
                required
                checked={acceptsTerms}
                onChange={(event) => setAcceptsTerms(event.target.checked)}
              />
              Acepto las condiciones de envío y confirmo que tengo los derechos
              necesarios sobre el material que envío.
            </label>
          </div>
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
              disabled={
                !title.trim() ||
                !author.trim() ||
                (!book && (!readyToSend || !acceptsTerms))
              }
            >
              {book ? "Guardar cambios" : "Enviar para revisión"}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
