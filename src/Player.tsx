import { useEffect, useMemo, useRef, useState } from "react";
import { tokenize, countWords, type Token } from "./parseMd";

type Props = {
  englishText: string;
  portugueseText: string;
  audioSrc: string | null;
};

type Highlight = {
  tokens: Token[];
  totalWords: number;
};

function buildHighlight(text: string): Highlight {
  const tokens = tokenize(text);
  return { tokens, totalWords: countWords(tokens) };
}

export function Player({ englishText, portugueseText, audioSrc }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);

  const en = useMemo(() => buildHighlight(englishText), [englishText]);

  const activeIndex = useMemo(() => {
    if (!playing || duration <= 0 || en.totalWords === 0) return -1;
    const perWord = duration / en.totalWords;
    if (perWord <= 0) return -1;
    const idx = Math.floor(currentTime / perWord);
    return Math.min(idx, en.totalWords - 1);
  }, [playing, duration, currentTime, en.totalWords]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnd);
    };
  }, [audioSrc]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    if (!autoScroll || activeIndex < 0) return;
    const el = document.querySelector(
      `[data-word-index="${activeIndex}"]`,
    ) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex, autoScroll]);

  return (
    <div className="player">
      {audioSrc ? (
        <div className="player-controls">
          <audio
            ref={audioRef}
            src={audioSrc}
            controls
            preload="metadata"
          />
          <label className="rate">
            Velocidade:
            <select
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                <option key={r} value={r}>
                  {r}x
                </option>
              ))}
            </select>
          </label>
          <label className="autoscroll">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
        </div>
      ) : (
        <div className="no-audio">Sem áudio disponível.</div>
      )}

      <div className="bilingual">
        <section className="column">
          <h3>English</h3>
          <div className="text">
            {renderParagraphs(englishText, activeIndex)}
          </div>
        </section>
        <section className="column">
          <h3>Português</h3>
          <div className="text">
            {portugueseText.split(/\n\s*\n/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function renderParagraphs(text: string, activeIndex: number) {
  const paragraphs = text.split(/\n\s*\n/);
  let wordCursor = 0;
  return paragraphs.map((para, pIdx) => {
    const tokens = tokenize(para);
    const out = tokens.map((t, i) => {
      if (t.kind === "gap") return <span key={i}>{t.text}</span>;
      const absIdx = wordCursor++;
      const isActive = absIdx === activeIndex;
      const isPast = absIdx < activeIndex;
      return (
        <span
          key={i}
          data-word-index={absIdx}
          className={
            "word" + (isActive ? " active" : isPast ? " past" : "")
          }
        >
          {t.text}
        </span>
      );
    });
    return <p key={pIdx}>{out}</p>;
  });
}
