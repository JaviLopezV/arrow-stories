"use client";
import Link from "next/link";
import BookAudio from "./BookAudio";
import { useEffect, useRef, useState } from "react";
import {
  type Story,
  progressKey,
  lastReadKey,
  localizeStory,
} from "@/content/stories";
import { LanguageSwitcher, useLanguage } from "@/i18n/LanguageProvider";
import { languages } from "@/i18n/messages";
export default function Reader({ story: source }: { story: Story }) {
  const { locale, t } = useLanguage();
  const published = source;
  const story = localizeStory(published, locale);
  const downloadUrl = `/api/books/${story.slug}/download/?lang=${story.contentLocale}`;
  useEffect(() => {
    document.title = `${story.title} · Lumbre`;
  }, [story.title]);
  const [page, setPage] = useState(1);
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(true);
  const [size, setSize] = useState(19);
  const chapterIndex = useRef<HTMLDialogElement>(null);
  const chapters = story.pages.filter(
    (entry, index) =>
      index === 0 || entry.chapter !== story.pages[index - 1].chapter,
  );
  const defaultPageCount = localizeStory(
    published,
    published.originalLocale ?? "es",
  ).pages.length;
  useEffect(() => {
    try {
      const n = Number(localStorage.getItem(progressKey(story.slug)));
      if (Number.isInteger(n) && n >= 1 && n <= defaultPageCount) setPage(n);
    } catch {}
    setReady(true);
  }, [story.slug, defaultPageCount]);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(progressKey(story.slug), String(page));
        localStorage.setItem(lastReadKey, story.slug);
      } catch {}
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [page, ready, story.slug]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        chapterIndex.current?.open ||
        (e.target as HTMLElement).matches(
          "input,select,textarea,[contenteditable=true]",
        )
      )
        return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setPage((p) => Math.min(story.pages.length, p + 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPage((p) => Math.max(1, p - 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [story.pages.length]);
  const visiblePage = Math.min(page, story.pages.length);
  const current = story.pages[visiblePage - 1];
  const currentChapter = chapters.findLast(
    (entry) => entry.number <= visiblePage,
  );
  useEffect(() => {
    setPage((p) => Math.min(p, story.pages.length));
  }, [story.pages.length]);
  return (
    <main className={`reader ${dark ? "reader-dark" : ""}`}>
      <header className="reader-header">
        <Link href="/">← {t.library}</Link>
        <span className="reader-title">{story.title}</span>
        <div className="reader-settings">
          <button
            aria-haspopup="dialog"
            onClick={() => {
              const dialog = chapterIndex.current;
              dialog?.showModal();
              dialog
                ?.querySelector('[aria-current="location"]')
                ?.scrollIntoView({ block: "nearest" });
            }}
          >
            {t.chapterIndex}
          </button>
          <LanguageSwitcher />
          <button
            aria-label={t.smaller}
            disabled={size <= 16}
            onClick={() => setSize((s) => s - 1)}
          >
            A−
          </button>
          <button
            aria-label={t.bigger}
            disabled={size >= 26}
            onClick={() => setSize((s) => s + 1)}
          >
            A+
          </button>
          <button
            aria-label={dark ? t.light : t.dark}
            onClick={() => setDark((d) => !d)}
          >
            {dark ? "☀" : "☾"}
          </button>
        </div>
      </header>
      <dialog
        ref={chapterIndex}
        className="chapter-index"
        aria-labelledby="chapter-index-title"
      >
        <div className="chapter-index-header">
          <h2 id="chapter-index-title">{t.chapterIndex}</h2>
          <form method="dialog">
            <button aria-label={t.closeChapterIndex} autoFocus>
              ×
            </button>
          </form>
        </div>
        <ol lang={story.contentLocale}>
          {chapters.map((entry) => (
            <li key={entry.number}>
              <button
                type="button"
                aria-current={entry === currentChapter ? "location" : undefined}
                onClick={() => {
                  chapterIndex.current?.close();
                  setPage(entry.number);
                }}
              >
                <span>{entry.chapter}</span>
                <span lang={locale}>
                  {t.page} {entry.number}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </dialog>
      <div
        className="reading-progress"
        style={{ width: `${(page / story.pages.length) * 100}%` }}
      />
      <article
        className="reading-page"
        lang={story.contentLocale}
        style={{ fontSize: size }}
      >
        {story.contentLocale !== locale && (
          <p className="translation-notice" role="status">
            {t.fallback} {languages[story.contentLocale]}.
          </p>
        )}
        <BookAudio
          key={`${story.slug}:${locale}`}
          book={story}
          contentLocale={story.contentLocale}
          page={visiblePage}
        />
        <p className="eyebrow">{story.author}</p>
        {story.source && (
          <p className="translation-notice">
            <a href={story.source}>{t.sourceLabel}</a>
            {story.credit && <> · {story.credit}</>}
          </p>
        )}
        <h1>{story.title}</h1>
        <div className="book-downloads">
          <a href={`${downloadUrl}&format=txt`} download>
            {t.downloadBook} TXT
          </a>
          <a href={`${downloadUrl}&format=pdf`} download>
            {t.downloadBook} PDF
          </a>
        </div>
        <div className="chapter">
          <span />
          {current.chapter}
          <span />
        </div>
        <div key={page} className="prose">
          {current.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <span className="page-number" aria-live="polite">
          — {page} —
        </span>
        {page === story.pages.length && (
          <div className="end-note">
            <h2>{t.end}</h2>
            <p>{t.thanks}</p>
            <Link href="/">{t.discover} ↗</Link>
          </div>
        )}
      </article>
      <nav className="reader-pagination" aria-label={t.pagination}>
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          ← {t.previous}
        </button>
        <label>
          {t.page}{" "}
          <select
            aria-label={t.goPage}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
          >
            {story.pages.map((p) => (
              <option key={p.number} value={p.number}>
                {p.number}
              </option>
            ))}
          </select>{" "}
          {t.of} {story.pages.length}
        </label>
        <button
          disabled={page === story.pages.length}
          onClick={() => setPage((p) => p + 1)}
        >
          {t.next} →
        </button>
      </nav>
      <p className="reader-hint">{t.hint}</p>
    </main>
  );
}
