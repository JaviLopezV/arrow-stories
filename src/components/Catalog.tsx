"use client";
import Link from "next/link";
import { languages, type Locale } from "@/i18n/messages";
import { useEffect, useState } from "react";
import {
  type Story,
  progressKey,
  lastReadKey,
  localizeStory,
} from "@/content/stories";
import { LanguageSwitcher, useLanguage } from "@/i18n/LanguageProvider";
export default function Catalog({ books }: { books: Story[] }) {
  const { locale, t } = useLanguage();
  useEffect(() => {
    document.title = `Lumbre · ${t.waiting}`;
  }, [t.waiting]);
  const [lastReadSlug, setLastReadSlug] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState("all");
  const [contentLanguage, setContentLanguage] = useState<Locale | "all">("all");
  const [query, setQuery] = useState("");
  useEffect(() => {
    function updateLastRead() {
      try {
        setLastReadSlug(localStorage.getItem(lastReadKey));
      } catch {
        setLastReadSlug(null);
      }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === lastReadKey || event.key === null) updateLastRead();
    }
    updateLastRead();
    window.addEventListener("pageshow", updateLastRead);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("pageshow", updateLastRead);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const lastRead = books.find((book) => book.slug === lastReadSlug);
  const featured = lastRead ?? books.find((book) => book.source) ?? books[0];
  const story = featured && localizeStory(featured, locale);
  useEffect(() => {
    if (!story) return;
    try {
      const n = Number(localStorage.getItem(progressKey(story.slug)));
      setProgress(
        Number.isInteger(n) && n >= 1 && n <= story.pages.length ? n : 0,
      );
    } catch {
      setProgress(0);
    }
  }, [story?.slug, story?.pages.length]);
  const visibleBooks = books
    .filter(
      (book) =>
        contentLanguage === "all" ||
        Boolean(book.translations[contentLanguage]),
    )
    .map((book) =>
      localizeStory(book, contentLanguage === "all" ? locale : contentLanguage),
    )
    .filter(
      (book) =>
        (filter === "all" || filter === book.genre) &&
        book.title.toLowerCase().includes(query.toLowerCase()),
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
        {story && (
          <section className="hero">
            <div className="hero-art" />
            <div className="hero-shade" />
            <div className="hero-content">
              <p className="eyebrow">
                ● &nbsp; {lastRead ? t.lastRead : t.featured}
              </p>
              {story.collection && (
                <p className="hero-kicker">{story.collection}</p>
              )}
              <h1 lang={story.contentLocale}>{story.title}</h1>
              <div className="metadata">
                <span>
                  {
                    t[
                      story.genre as "fantasy" | "mystery" | "romance" | "drama"
                    ]
                  }
                </span>
                <i />
                {story.pages.length} {t.pages}
                <i />
                {t.free}
              </div>
              <div className="hero-actions">
                <Link className="button primary" href={`/leer/${story.slug}`}>
                  ▸ &nbsp; {lastRead || progress ? t.continue : t.start}
                  <span>↗</span>
                </Link>
                <a className="text-button" href="#biblioteca">
                  {t.exploreLibrary} ↓
                </a>
              </div>
              <p className="hero-footnote">{t.footnote}</p>
            </div>
            <div className="hero-caption">
              <span>{t.authorLabel}</span>
              <strong>{story.author}</strong>
            </div>
          </section>
        )}
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
              {t.library} &nbsp; {String(books.length).padStart(2, "0")}
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
            <div className="library-search-controls">
              <label className="library-language">
                {t.filterLanguage}
                <select
                  value={contentLanguage}
                  onChange={(e) =>
                    setContentLanguage(e.target.value as Locale | "all")
                  }
                >
                  <option value="all">{t.allLanguages}</option>
                  {Object.entries(languages).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
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
          </div>
          <div className="story-grid">
            {visibleBooks.map((book) => (
              <BookCard key={book.slug} book={book} />
            ))}
          </div>
          {!visibleBooks.length && (
            <p className="empty" role="status">
              {t.empty}
            </p>
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
      <div className={`cover ${art} ${book.cover ? "uploaded-cover" : ""}`}>
        {book.cover && <img src={book.cover} alt="" loading="lazy" />}
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
