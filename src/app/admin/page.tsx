"use client";
import BookForm from "@/components/BookForm";
import Link from "next/link";
import { useState } from "react";
import { localizeStory, type Story } from "@/content/stories";
import { languages, type Locale } from "@/i18n/messages";

type Entry = Pick<Story, "slug" | "title" | "author">;
type ManagedBook = Entry & { status: "active" | "inactive" };
type Action = "activate" | "deactivate" | "delete";
export default function Admin() {
  const [token, setToken] = useState("");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [books, setBooks] = useState<ManagedBook[]>([]);
  const [deleting, setDeleting] = useState<ManagedBook | null>(null);
  const [editing, setEditing] = useState<Story | null>(null);
  const [section, setSection] = useState<"catalog" | "requests">("catalog");
  const [queryText, setQueryText] = useState("");
  const [book, setBook] = useState<Story | null>(null);
  const [aiReview, setAiReview] = useState<{
    text: string;
    partial: boolean;
  } | null>(null);
  const [reviewingWithAi, setReviewingWithAi] = useState(false);
  const [reviewLocale, setReviewLocale] = useState<Locale>("es");
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const story = book && localizeStory(book, reviewLocale);
  const current = story?.pages[page];

  async function act(
    slug?: string,
    decision?: "approve" | "reject",
    action?: Action | "edit" | "ai-review",
  ) {
    if (action === "edit") setEditing(null);
    setBusy(true);
    setReviewingWithAi(action === "ai-review");
    setNotice("");
    const query = new URLSearchParams();
    if (slug) query.set("slug", slug);
    if (action) query.set("action", action);
    if (decision) query.set("decision", decision);
    try {
      const response = await fetch(`/api/book-requests/?${query}`, {
        method: decision || (action && action !== "edit") ? "POST" : "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        if (
          (!action || action === "ai-review") &&
          (response.status === 404 || response.status === 409)
        ) {
          setEntries(
            (items) => items?.filter((item) => item.slug !== slug) ?? null,
          );
          setBook(null);
        }
        throw new Error(result.error);
      }
      if (action === "edit") {
        setEditing(result.book);
      } else if (action === "ai-review") {
        setAiReview(result.aiReview);
      } else if (action) {
        setBooks((items) =>
          action === "delete"
            ? items.filter((item) => item.slug !== slug)
            : items.map((item) =>
                item.slug === slug
                  ? {
                      ...item,
                      status: action === "activate" ? "active" : "inactive",
                    }
                  : item,
              ),
        );
        setDeleting(null);
        setNotice(
          action === "delete"
            ? "Libro eliminado del catálogo."
            : action === "activate"
              ? "Libro activado."
              : "Libro desactivado.",
        );
      } else if (decision) {
        if (decision === "approve" && book && book.slug === slug) {
          const { slug, title, author } = book;
          setBooks((items) => [
            ...items,
            { slug, title, author, status: "active" },
          ]);
        }
        setEntries(
          (items) => items?.filter((item) => item.slug !== slug) ?? null,
        );
        setBook(null);
        setNotice(
          decision === "approve"
            ? "Libro publicado en la biblioteca."
            : "Petición rechazada.",
        );
      } else if (slug) {
        setBook(result.book);
        setAiReview(result.aiReview ?? null);
        setReviewLocale(result.book.originalLocale ?? "es");
        setPage(0);
      } else {
        setEditing(null);
        setEntries(result.requests);
        setBooks(result.books);
        setDeleting(null);
        setBook(null);
      }
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setBusy(false);
      setReviewingWithAi(false);
    }
  }

  return (
    <main className="admin-page book-workspace">
      <Link href="/">← Volver a la biblioteca</Link>
      <header className="workspace-heading">
        <p className="eyebrow">LUMBRE · ADMINISTRACIÓN</p>
        <h1>Gestionar la biblioteca</h1>
        <p>
          Edita los libros del catálogo o revisa los cuentos enviados por los
          lectores.
        </p>
      </header>
      <form
        className="admin-panel admin-access"
        onSubmit={(event) => {
          event.preventDefault();
          void act();
        }}
      >
        <label>
          Clave de administrador
          <input
            type="password"
            autoComplete="off"
            value={token}
            disabled={busy}
            onChange={(event) => {
              setToken(event.target.value);
              setEditing(null);
              setEntries(null);
              setBooks([]);
              setDeleting(null);
              setBook(null);
              setNotice("");
            }}
          />
        </label>
        <button disabled={busy || !token}>
          {entries ? "Actualizar panel" : "Abrir panel"}
        </button>
      </form>
      <p role="status" className="workspace-notice">
        {notice ||
          (reviewingWithAi
            ? "Revisando el manuscrito con IA…"
            : busy
              ? "Cargando…"
              : "")}
      </p>
      {entries && (
        <nav
          className="workspace-tabs"
          aria-label="Secciones de administración"
        >
          <button
            aria-pressed={section === "catalog"}
            onClick={() => {
              setSection("catalog");
              setBook(null);
            }}
          >
            Catálogo <span>{books.length}</span>
          </button>
          <button
            aria-pressed={section === "requests"}
            onClick={() => {
              setSection("requests");
              setEditing(null);
            }}
          >
            Peticiones <span>{entries.length}</span>
          </button>
        </nav>
      )}
      {section === "catalog" && editing && (
        <section className="workspace-editor" aria-label="Editor del libro">
          <h2>Editar · {editing.title}</h2>
          <BookForm
            key={editing.slug}
            book={editing}
            token={token}
            onCancel={() => setEditing(null)}
            onSave={(result) => {
              setBooks((items) =>
                items.map((item) =>
                  item.slug === result.slug ? { ...item, ...result } : item,
                ),
              );
              setEditing(null);
              setNotice("Cambios guardados.");
            }}
          />
        </section>
      )}
      {entries && section === "catalog" && !editing && (
        <section className="admin-panel">
          <h2>Libros del catálogo ({books.length})</h2>
          {!books.length && <p>No hay libros para gestionar.</p>}
          <label>
            Buscar por título o autor
            <input
              type="search"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
            />
          </label>
          <ul className="workspace-list">
            {books
              .filter((item) =>
                `${item.title} ${item.author}`
                  .toLowerCase()
                  .includes(queryText.trim().toLowerCase()),
              )
              .map((item) => (
                <li key={item.slug}>
                  <p>
                    <strong>{item.title}</strong>
                    <br />
                    {item.author}{" "}
                    <span className="book-status" data-status={item.status}>
                      {item.status === "active" ? "Activo" : "Desactivado"}
                    </span>
                  </p>
                  <div className="book-actions">
                    <button
                      disabled={busy}
                      onClick={() => void act(item.slug, undefined, "edit")}
                    >
                      Editar
                    </button>
                    {item.status === "active" && (
                      <Link prefetch={false} href={`/leer/${item.slug}/`}>
                        Abrir libro
                      </Link>
                    )}{" "}
                    <button
                      disabled={busy}
                      onClick={() =>
                        void act(
                          item.slug,
                          undefined,
                          item.status === "active" ? "deactivate" : "activate",
                        )
                      }
                    >
                      {item.status === "active" ? "Desactivar" : "Activar"}
                    </button>{" "}
                    <button disabled={busy} onClick={() => setDeleting(item)}>
                      Eliminar…
                    </button>
                  </div>
                  {deleting?.slug === item.slug && (
                    <div>
                      <p>
                        «{item.title}» desaparecerá de la biblioteca y de este
                        panel. Si solo quieres ocultarlo temporalmente, usa
                        Desactivar.
                      </p>
                      <button
                        disabled={busy}
                        onClick={() => void act(item.slug, undefined, "delete")}
                      >
                        Confirmar eliminación
                      </button>{" "}
                      <button disabled={busy} onClick={() => setDeleting(null)}>
                        Cancelar
                      </button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </section>
      )}
      {entries && section === "requests" && (
        <section className="admin-panel">
          <h2>Pendientes ({entries.length})</h2>
          {entries.length ? (
            <ul className="workspace-list">
              {entries.map((entry) => (
                <li key={entry.slug}>
                  <p>
                    {entry.title} · {entry.author}{" "}
                    <button
                      disabled={busy}
                      onClick={() => void act(entry.slug)}
                    >
                      Revisar
                    </button>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay peticiones pendientes.</p>
          )}
        </section>
      )}
      {section === "requests" && story && current && (
        <section className="admin-panel">
          <h2>{story.title}</h2>
          {story.cover && (
            <img
              className="cover-preview"
              src={story.cover}
              alt="Portada enviada"
            />
          )}
          <p>
            {story.author} · {languages[story.contentLocale]} ·{" "}
            {story.pages.length} páginas
          </p>
          {book && Object.keys(book.translations).length > 1 && (
            <label>
              Idioma del manuscrito
              <select
                value={reviewLocale}
                onChange={(event) => {
                  setReviewLocale(event.target.value as Locale);
                  setPage(0);
                }}
              >
                {(Object.keys(book.translations) as Locale[]).map((item) => (
                  <option key={item} value={item}>
                    {languages[item]}
                    {item === (book.originalLocale ?? "es")
                      ? " (principal)"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Página
            <select
              value={page}
              onChange={(event) => setPage(Number(event.target.value))}
            >
              {story.pages.map((item, index) => (
                <option key={item.number} value={index}>
                  {item.number} · {item.chapter}
                </option>
              ))}
            </select>
          </label>
          <article className="admin-preview" lang={story.contentLocale}>
            <h3>{current.chapter}</h3>
            {current.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </article>
          {aiReview ? (
            <article className="admin-preview">
              <h3>Informe de revisión con IA</h3>
              <p>
                Manuscrito principal · {languages[book?.originalLocale ?? "es"]}
                {aiReview.partial ? " · Revisión parcial del comienzo" : ""}
              </p>
              <p className="ai-review-text">{aiReview.text}</p>
            </article>
          ) : (
            <button
              disabled={busy}
              onClick={() => void act(story.slug, undefined, "ai-review")}
            >
              {reviewingWithAi ? "Revisando con IA…" : "Revisar con IA"}
            </button>
          )}
          <p>
            Al aprobar, el libro aparecerá en la biblioteca para todos los
            lectores.
          </p>
          <button
            disabled={busy}
            onClick={() => void act(story.slug, "approve")}
          >
            Aprobar y publicar
          </button>{" "}
          <button
            disabled={busy}
            onClick={() => void act(story.slug, "reject")}
          >
            Rechazar
          </button>
        </section>
      )}
    </main>
  );
}
