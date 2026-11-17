"use client";

import { useEffect, useRef, useState } from "react";
import type { StoryTranslation } from "@/content/stories";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { Locale } from "@/i18n/messages";

type Playback = "idle" | "playing" | "paused" | "unsupported" | "error";

function* speechChunks(text: string) {
  // Short utterances avoid browser limits on long passages.
  for (const [chunk] of text.matchAll(/\S[\s\S]{0,219}(?=\s|$)|\S{1,220}/gu)) {
    yield chunk;
  }
}

function* bookChunks(book: StoryTranslation, firstPage?: number) {
  if (firstPage === undefined) yield* speechChunks(book.title);
  let chapter = firstPage === undefined ? book.title : undefined;
  for (const page of book.pages.slice((firstPage ?? 1) - 1)) {
    if (page.chapter !== chapter) {
      chapter = page.chapter;
      yield* speechChunks(chapter);
    }
    for (const paragraph of page.paragraphs) {
      yield* speechChunks(paragraph);
    }
  }
}

function voicesFor(speech: SpeechSynthesis, locale: Locale) {
  return speech
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().split(/[-_]/)[0] === locale);
}

export default function BookAudio({
  book,
  contentLocale,
  page,
}: {
  book: StoryTranslation;
  contentLocale: Locale;
  page: number;
}) {
  const { t } = useLanguage();
  const [playback, setPlayback] = useState<Playback>("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voiceSelect = useRef<HTMLSelectElement>(null);
  const current = useRef<SpeechSynthesisUtterance | null>(null);

  function cancelSpeech() {
    if (!current.current) return;
    current.current = null;
    window.speechSynthesis.cancel();
  }

  useEffect(() => {
    function stopOnPageHide() {
      cancelSpeech();
      setPlayback("idle");
    }
    window.addEventListener("pagehide", stopOnPageHide);
    return () => {
      window.removeEventListener("pagehide", stopOnPageHide);
      cancelSpeech();
    };
  }, []);

  useEffect(() => {
    const speech = window.speechSynthesis;
    if (!speech) return;
    function refreshVoices() {
      setVoices(voicesFor(speech, contentLocale));
    }
    speech.addEventListener("voiceschanged", refreshVoices);
    refreshVoices();
    return () => speech.removeEventListener("voiceschanged", refreshVoices);
  }, [contentLocale]);

  function togglePause() {
    if (!current.current) return;
    const speech = window.speechSynthesis;
    if (playback === "paused") {
      speech.resume();
      setPlayback("playing");
    } else {
      speech.pause();
      setPlayback("paused");
    }
  }

  function startPlayback(firstPage?: number) {
    const speech = window.speechSynthesis;
    if (!speech || typeof window.SpeechSynthesisUtterance !== "function") {
      setPlayback("unsupported");
      return;
    }
    cancelSpeech();
    const chunks = bookChunks(book, firstPage);

    function speakNext() {
      const next = chunks.next();
      if (next.done) {
        current.current = null;
        setPlayback("idle");
        return;
      }
      const available = voicesFor(speech, contentLocale);
      const voice =
        available.find(
          (item) => item.voiceURI === voiceSelect.current?.value,
        ) ??
        available.find((item) => item.default) ??
        available[0];
      const utterance = new SpeechSynthesisUtterance(next.value);
      utterance.lang = voice?.lang ?? contentLocale;
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        if (current.current === utterance) speakNext();
      };
      utterance.onerror = () => {
        if (current.current !== utterance) return;
        current.current = null;
        setPlayback("error");
      };
      current.current = utterance;
      speech.speak(utterance);
    }

    if (speech.paused) speech.resume();
    setPlayback("playing");
    speakNext();
  }

  const active = playback === "playing" || playback === "paused";
  return (
    <div className="book-audio">
      <div className="reader-settings">
        <button type="button" onClick={() => startPlayback()}>
          {t.audioPlay}
        </button>
        <button type="button" onClick={() => startPlayback(page)}>
          {t.audioFromPage} {page}
        </button>
        <label>
          {t.audioVoice}
          <select ref={voiceSelect} defaultValue="" disabled={!voices.length}>
            <option value="">{t.audioDefaultVoice}</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </label>
        {active && (
          <>
            <button type="button" onClick={togglePause}>
              {playback === "paused" ? t.audioResume : t.audioPause}
            </button>
            <button
              type="button"
              onClick={() => {
                cancelSpeech();
                setPlayback("idle");
              }}
            >
              {t.audioStop}
            </button>
          </>
        )}
      </div>
      <div role="status">
        {playback === "unsupported" && t.audioUnsupported}
        {playback === "error" && t.audioError}
      </div>
    </div>
  );
}
