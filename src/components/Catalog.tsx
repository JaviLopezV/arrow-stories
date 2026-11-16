"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type Story, progressKey, localizeStory } from "@/content/stories";
import { LanguageSwitcher, useLanguage } from "@/i18n/LanguageProvider";
export default function Catalog({ books }: { books: Story[] }) {
  const { locale, t } = useLanguage();
  const upcoming = [
    { title: t.summer, genre: "drama", art: "summer", tag: t.shortStory },
    { title: t.city, genre: "mystery", art: "city", tag: t.novel },
    { title: t.unsaid, genre: "romance", art: "moon", tag: t.shortStory },
  ];
  useEffect(() => {
    document.title = `Lumbre · ${t.waiting}`;
  }, [t.waiting]);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const story = localizeStory(books[0], locale);
  useEffect(() => {
    try {
      const n = Number(localStorage.getItem(progressKey(story.slug)));
      if (Number.isInteger(n) && n >= 1 && n <= story.pages.length)
        setProgress(n);
    } catch {}
  }, [story.slug, story.pages.length]);
  const visibleBooks = books
    .map((book) => localizeStory(book, locale))
    .filter(
      (book) =>
        (filter === "all" || filter === book.genre) &&
        book.title.toLowerCase().includes(query.toLowerCase()),
    );
  const previews = upcoming.filter(
    (s) =>
      (filter === "all" || s.genre === filter) &&
      s.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <header className="header">
        <Link className="brand" href="/" aria-label={t.home}>
          <span>◒</span> lumbre.
        </Link>
        <nav aria-label={t.navigation}>
          <a className="active" href="#biblioteca">
            {t.explore}
          </a>
          <a href="#sobre">{t.project} ↗</a>
        </nav>
        <span className="header-note">{t.headerNote}</span>
        <LanguageSwitcher />
      </header>
      <main>
        <section className="hero">
          <div className="hero-art" />
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow">
              ● &nbsp; {t.featured} <span>/</span> Nº 001
            </p>
            <p className="hero-kicker">{t.kicker}</p>
            <h1>
              {t.heroStart}
              <br />
              {t.heroEnd} <em>{t.heroEmphasis}</em>
            </h1>
            <p className="hero-description">
              {t.descriptionStart}
              <br />
              {t.descriptionEnd}
            </p>
            <div className="metadata">
              <span>{t.fantasy}</span>
              <i />
              {story.pages.length} {t.pages}
              <i />
              {t.free}
            </div>
            <div className="hero-actions">
              <Link className="button primary" href={`/leer/${story.slug}`}>
                ▸ &nbsp; {progress ? t.continue : t.start}
                <span>↗</span>
              </Link>
              <a className="text-button" href="#biblioteca">
                {t.exploreLibrary} ↓
              </a>
            </div>
            <p className="hero-footnote">{t.footnote}</p>
          </div>
          <div className="hero-caption">
            <span>{t.original}</span>
            <strong>J. López</strong>
          </div>
          <div className="hero-counter">
            01 <span>/ 01</span>
            <div />
          </div>
        </section>
        <section id="biblioteca" className="library">
          <div className="section-heading">
            <div>
              <p className="eyebrow muted">{t.escape}</p>
              <h2>
                {t.waiting}
                <span>.</span>
              </h2>
            </div>
            <span className="library-count">
              {t.library} &nbsp;{" "}
              {String(books.length + upcoming.length).padStart(2, "0")}
            </span>
          </div>
          <div className="library-toolbar">
            <div className="filters" aria-label={t.filter}>
              {(["all", "fantasy", "mystery", "romance", "drama"] as const).map(
                (item) => (
                  <button
                    key={item}
                    aria-pressed={filter === item}
                    className={filter === item ? "selected" : ""}
                    onClick={() => setFilter(item)}
                  >
                    {t[item]}
                  </button>
                ),
              )}
            </div>
            <label className="search">
              <span>⌕</span>
              <input
                aria-label={t.search}
                placeholder={t.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          <div className="story-grid">
            {visibleBooks.map((book) => (
              <BookCard key={book.slug} book={book} />
            ))}
            {previews.map((s) => (
              <article className="story-card upcoming" key={s.title}>
                <div className={`cover ${s.art}`}>
                  <span className="cover-tag soon">{t.soon}</span>
                  <div className="cover-type">
                    <small>{s.tag} · J. LÓPEZ</small>
                    <h3>{s.title}</h3>
                    <span>{t.coming}</span>
                  </div>
                </div>
                <div className="card-meta">
                  <span>{t[s.genre as "drama" | "mystery" | "romance"]}</span>
                  <span>{t.writing}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{t.patience}</p>
              </article>
            ))}
          </div>
          {!visibleBooks.length && !previews.length && (
            <p className="empty">{t.empty}</p>
          )}
          <div className="library-bottom">
            <span>{t.rhythm}</span>
            <a href="#">{t.top} ↑</a>
          </div>
        </section>
        <section id="sobre" className="about">
          <span className="about-symbol">✳</span>
          <p>
            {t.forThose}
            <br />
            <em>{t.oneMore}</em>
          </p>
          <div>
            {t.about}
            <span>{t.open}</span>
          </div>
        </section>
      </main>
      <footer>
        <Link className="brand" href="/">
          ◒ lumbre.
        </Link>
        <span>{t.footer}</span>
        <span>
          © {new Date().getFullYear()} Lumbre ·{" "}
          <Link href="/enviar">Enviar un libro</Link> ·{" "}
          <Link href="/admin">Administrar</Link>
        </span>
      </footer>
    </>
  );
}

function BookCard({ book }: { book: ReturnType<typeof localizeStory> }) {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    try {
      const value = Number(localStorage.getItem(progressKey(book.slug)));
      setProgress(
        Number.isInteger(value) && value >= 1
          ? Math.min(value, book.pages.length)
          : 0,
      );
    } catch {
      setProgress(0);
    }
  }, [book.slug, book.pages.length]);
  const genre = book.genre as "fantasy" | "mystery" | "romance" | "drama";
  const art = {
    fantasy: "forest",
    mystery: "city",
    romance: "moon",
    drama: "summer",
  }[genre];
  return (
    <Link href={`/leer/${book.slug}`} className="story-card">
      <div className={`cover ${art}`}>
        <span className="cover-tag">{t.available}</span>
        <div className="cover-type">
          <small>{book.author}</small>
          <h3>{book.title}</h3>
          <span>{t[genre]}</span>
        </div>
        <span className="cover-arrow">↗</span>
        {progress > 0 && (
          <div
            className="cover-progress"
            style={{ width: `${(progress / book.pages.length) * 100}%` }}
          />
        )}
      </div>
      <div className="card-meta">
        <span>{t[genre]}</span>
        <span>
          {book.pages.length} {t.pages}
        </span>
      </div>
      <h3>{book.title}</h3>
      <p>{progress ? `${t.resumePage} ${progress}` : book.author}</p>
    </Link>
  );
}
