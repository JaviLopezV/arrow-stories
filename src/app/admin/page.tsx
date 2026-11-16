"use client";
import Link from "next/link";
import { useState } from "react";
import { localizeStory, type Story } from "@/content/stories";
import { languages } from "@/i18n/messages";

type Entry = Pick<Story, "slug" | "title" | "author">;
export default function Admin() {
  const [token, setToken] = useState("");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [book, setBook] = useState<Story | null>(null);
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const story = book && localizeStory(book, book.originalLocale ?? "es");
  const current = story?.pages[page];

  async function act(slug?: string, decision?: "approve" | "reject") {
    setBusy(true);
    setNotice("");
    const query = new URLSearchParams();
    if (slug) query.set("slug", slug);
    if (decision) query.set("decision", decision);
    try {
      const response = await fetch(`/api/book-requests/?${query}`, {
        method: decision ? "POST" : "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 404 || response.status === 409) {
          setEntries(
            (items) => items?.filter((item) => item.slug !== slug) ?? null,
          );
          setBook(null);
        }
        throw new Error(result.error);
      }
      if (decision) {
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
        setPage(0);
      } else {
        setEntries(result.requests);
        setBook(null);
      }
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-page">
      <Link href="/">← Volver a la biblioteca</Link>
      <p className="eyebrow">LUMBRE · ADMINISTRACIÓN</p>
      <h1>Peticiones de libros</h1>
      <form
        className="admin-panel"
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
              setEntries(null);
              setBook(null);
              setNotice("");
            }}
          />
        </label>
        <button disabled={busy || !token}>
          {entries ? "Actualizar peticiones" : "Ver peticiones"}
        </button>
      </form>
      <p role="status">{notice}</p>
      {entries && (
        <section className="admin-panel">
          <h2>Pendientes ({entries.length})</h2>
          {entries.length ? (
            <ul>
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
      {story && current && (
        <section className="admin-panel">
          <h2>{story.title}</h2>
          <p>
            {story.author} · {languages[story.contentLocale]} ·{" "}
            {story.pages.length} páginas
          </p>
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
          <article className="admin-preview">
            <h3>{current.chapter}</h3>
            {current.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </article>
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
