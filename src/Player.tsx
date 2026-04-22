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

type PlayerSettings = {
  autoScroll: boolean;
  rate: number;
  highlightWords: boolean;
};

const SETTINGS_KEY = "english-study-player-settings";
const RATE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function buildHighlight(text: string): Highlight {
  const tokens = tokenize(text);
  return { tokens, totalWords: countWords(tokens) };
}

function loadSettings(): PlayerSettings {
  if (typeof window === "undefined") {
    return { autoScroll: true, rate: 1, highlightWords: true };
  }

  const fallback: PlayerSettings = {
    autoScroll: true,
    rate: 1,
    highlightWords: true,
  };

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PlayerSettings>;
    return {
      autoScroll:
        typeof parsed.autoScroll === "boolean"
          ? parsed.autoScroll
          : fallback.autoScroll,
      rate:
        typeof parsed.rate === "number" &&
        RATE_OPTIONS.some((option) => option === parsed.rate)
          ? parsed.rate
          : fallback.rate,
      highlightWords:
        typeof parsed.highlightWords === "boolean"
          ? parsed.highlightWords
          : fallback.highlightWords,
    };
  } catch {
    return fallback;
  }
}

export function Player({ englishText, portugueseText, audioSrc }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<PlayerSettings>(() => loadSettings());

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
    if (audioRef.current) audioRef.current.playbackRate = settings.rate;
  }, [settings.rate]);

  useEffect(() => {
    if (!settings.autoScroll || activeIndex < 0) return;
    const el = document.querySelector(
      `[data-word-index="${activeIndex}"]`,
    ) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex, settings.autoScroll]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!settingsOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!settingsRef.current) return;
      const target = event.target as Node;
      if (!settingsRef.current.contains(target)) {
        setSettingsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen]);

  return (
    <div className={"player" + (settings.highlightWords ? "" : " no-highlight")}>      
      {audioSrc ? (
        <div className="player-controls">
          <audio
            ref={audioRef}
            src={audioSrc}
            controls
            preload="metadata"
          />
        </div>
      ) : (
        <div className="no-audio">Sem áudio disponível.</div>
      )}

      <div className="settings-floating" ref={settingsRef}>
        <button
          type="button"
          className={"settings-fab" + (settingsOpen ? " open" : "")}
          onClick={() => setSettingsOpen((prev) => !prev)}
          aria-expanded={settingsOpen}
          aria-controls="reader-settings-panel"
          aria-label="Abrir configurações de leitura"
          title="Configurações de leitura"
        >
          ⚙️
        </button>

        <div
          id="reader-settings-panel"
          className={"settings-panel" + (settingsOpen ? " open" : "")}
        >
          <h4>Leitura</h4>
          <label className="settings-row">
            <span>Auto-scroll</span>
            <input
              type="checkbox"
              checked={settings.autoScroll}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  autoScroll: e.target.checked,
                }))
              }
            />
          </label>
          <label className="settings-row">
            <span>Velocidade padrão</span>
            <select
              value={settings.rate}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  rate: Number(e.target.value),
                }))
              }
            >
              {RATE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}x
                </option>
              ))}
            </select>
          </label>
          <label className="settings-row">
            <span>Destacar palavras</span>
            <input
              type="checkbox"
              checked={settings.highlightWords}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  highlightWords: e.target.checked,
                }))
              }
            />
          </label>
        </div>
      </div>

      <div className="bilingual">
        <section className="column">
          <h3>English</h3>
          <div className="text">
            {renderParagraphs(
              englishText,
              settings.highlightWords ? activeIndex : -1,
            )}
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
