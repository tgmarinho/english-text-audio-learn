import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Player } from "./Player";
import { parseMd, type ParsedMd } from "./parseMd";
import type { Catalog, Collection, Item } from "./types";
import { useStudied } from "./useStudied";
import "./App.css";

const AUTH_SESSION_KEY = "english-study-auth";
const AUTH_USER = import.meta.env.VITE_APP_USER;
const AUTH_PASSWORD = import.meta.env.VITE_APP_PASSWORD;
const AUTH_CONFIGURED = Boolean(AUTH_USER && AUTH_PASSWORD);

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarStep, setSidebarStep] = useState<"collections" | "items">(
    "collections",
  );
  const [authenticated, setAuthenticated] = useState(() => {
    if (!AUTH_CONFIGURED || typeof window === "undefined") return false;
    return sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [itemMd, setItemMd] = useState<ParsedMd | null>(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [search, setSearch] = useState("");
  const [liveMessage, setLiveMessage] = useState("");
  const { isStudied, toggle, countFor } = useStudied();

  useEffect(() => {
    if (!authenticated) return;
    fetch("/catalog.json")
      .then((r) => r.json())
      .then((c: Catalog) => {
        setCatalog(c);
        const first = c.collections[0];
        if (first) {
          setActiveSlug(first.slug);
          if (first.items[0]) {
            setItemMd(null);
            setLoadingItem(true);
            setActiveItemId(first.items[0].id);
          }
        }
      });
  }, [authenticated]);

  const activeCollection: Collection | null = useMemo(() => {
    if (!catalog || !activeSlug) return null;
    return catalog.collections.find((c) => c.slug === activeSlug) ?? null;
  }, [catalog, activeSlug]);

  const activeItem: Item | null = useMemo(() => {
    if (!activeCollection || !activeItemId) return null;
    return activeCollection.items.find((i) => i.id === activeItemId) ?? null;
  }, [activeCollection, activeItemId]);

  useEffect(() => {
    if (!activeItem) return;
    fetch(activeItem.mdPath)
      .then((r) => r.text())
      .then((t) => setItemMd(parseMd(t)))
      .finally(() => setLoadingItem(false));
  }, [activeItem]);

  const filteredItems = useMemo(() => {
    if (!activeCollection) return [];
    const q = search.trim().toLowerCase();
    if (!q) return activeCollection.items;
    return activeCollection.items.filter(
      (i) => i.title.toLowerCase().includes(q) || i.id.includes(q),
    );
  }, [activeCollection, search]);

  const currentIdx =
    activeCollection && activeItem
      ? activeCollection.items.findIndex((i) => i.id === activeItem.id)
      : -1;

  const selectItem = (id: string | null) => {
    setActiveItemId(id);
    setItemMd(null);
    setLoadingItem(Boolean(id));
  };

  const go = (delta: number) => {
    if (!activeCollection || currentIdx < 0) return;
    const next = activeCollection.items[currentIdx + delta];
    if (next) selectItem(next.id);
  };

  const activeStudied =
    activeSlug && activeItem ? isStudied(activeSlug, activeItem.id) : false;

  const onToggleStudied = () => {
    if (!activeSlug || !activeItem) return;
    const nextStudied = !activeStudied;
    toggle(activeSlug, activeItem.id);
    setLiveMessage(
      nextStudied
        ? "Conteúdo marcado como estudado."
        : "Conteúdo desmarcado como estudado.",
    );
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!liveMessage) return;
    const timeout = window.setTimeout(() => setLiveMessage(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [liveMessage]);

  useEffect(() => {
    if (!sidebarOpen || typeof window === "undefined") return;
    const scrollActive = () => {
      document
        .querySelector<HTMLButtonElement>(".collection-btn.active")
        ?.scrollIntoView({ block: "nearest" });
      document
        .querySelector<HTMLButtonElement>(".item-btn.active")
        ?.scrollIntoView({ block: "nearest" });
    };

    const frame = window.requestAnimationFrame(scrollActive);
    return () => window.cancelAnimationFrame(frame);
  }, [sidebarOpen, activeSlug, activeItemId]);

  const onLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!AUTH_CONFIGURED) {
      setAuthError(
        "Autenticação não configurada. Defina VITE_APP_USER e VITE_APP_PASSWORD.",
      );
      return;
    }
    if (username === AUTH_USER && password === AUTH_PASSWORD) {
      sessionStorage.setItem(AUTH_SESSION_KEY, "1");
      setAuthenticated(true);
      setAuthError(null);
      setPassword("");
      return;
    }
    setAuthError("Usuário ou senha inválidos.");
  };

  if (!AUTH_CONFIGURED) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Configuração pendente</h1>
          <p>
            Defina <code>VITE_APP_USER</code> e <code>VITE_APP_PASSWORD</code>{" "}
            no ambiente para liberar o acesso.
          </p>
        </section>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="auth-page">
        <form className="auth-card" onSubmit={onLogin}>
          <h1>Acesso restrito</h1>
          <p>Digite seu usuário e senha para entrar no English Study.</p>
          <label className="auth-field">
            Usuário
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="auth-field">
            Senha
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {authError ? <p className="auth-error">{authError}</p> : null}
          <button type="submit" className="auth-submit">
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="app">
      <aside
        id="content-sidebar"
        className={
          "sidebar" +
          (sidebarOpen ? " open" : "") +
          (sidebarStep === "items" ? " step-items" : " step-collections")
        }
      >
        <header className="sidebar-header">
          <h1>
            English <em>Study</em>
          </h1>
        </header>
        <nav className="collections">
          {catalog?.collections.map((c) => {
            const done = countFor(c.slug);
            return (
              <button
                key={c.slug}
                className={
                  "collection-btn" + (c.slug === activeSlug ? " active" : "")
                }
                onClick={() => {
                  setActiveSlug(c.slug);
                  selectItem(c.items[0]?.id ?? null);
                  setSearch("");
                  setSidebarStep("items");
                }}
                aria-current={c.slug === activeSlug ? "true" : undefined}
              >
                <span className="c-title">{c.title}</span>
                <span className="c-count" title={`${done} estudados de ${c.count}`}>
                  {done > 0 ? `${done}/${c.count}` : c.count}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="items-panel">
          <div className="mobile-items-header">
            <button
              type="button"
              className="mobile-back-btn"
              onClick={() => setSidebarStep("collections")}
            >
              ← Categorias
            </button>
            <button
              type="button"
              className="mobile-close-btn"
              onClick={() => setSidebarOpen(false)}
            >
              Fechar
            </button>
          </div>
          <label htmlFor="item-search" className="sr-only">
            Buscar conteúdo
          </label>
          <input
            id="item-search"
            className="search"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="items">
            {filteredItems.map((it) => {
              const studied = activeSlug ? isStudied(activeSlug, it.id) : false;
              return (
                <li key={it.id}>
                  <button
                    className={
                      "item-btn" +
                      (it.id === activeItemId ? " active" : "") +
                      (it.audioPath ? "" : " no-audio") +
                      (studied ? " studied" : "")
                    }
                    onClick={() => {
                      selectItem(it.id);
                      setSidebarOpen(false);
                    }}
                    title={it.title}
                    aria-current={it.id === activeItemId ? "true" : undefined}
                  >
                    <span className="item-mark" aria-hidden="true">
                      {studied ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="item-id">{it.id}</span>
                    <span className="item-title">{it.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
      <button
        className={"sidebar-backdrop" + (sidebarOpen ? " open" : "")}
        onClick={() => setSidebarOpen(false)}
        aria-label="Fechar lista de conteúdos"
      />

      <main className="viewer">
        {!activeItem && <div className="empty">Selecione um texto.</div>}
        {activeItem && (
          <>
            <header className="viewer-header">
              <div>
                <button
                  className="mobile-menu-btn"
                  onClick={() => {
                    setSidebarStep("collections");
                    setSidebarOpen(true);
                  }}
                  aria-expanded={sidebarOpen}
                  aria-controls="content-sidebar"
                >
                  Conteúdos
                </button>
                <div className="breadcrumb">{activeCollection?.title}</div>
                <h2>
                  <span className="item-num">№ {activeItem.id}</span>
                  {activeItem.title}
                </h2>
              </div>
              <div className="nav-buttons">
                <button
                  className={"study-btn" + (activeStudied ? " done" : "")}
                  onClick={onToggleStudied}
                  title={
                    activeStudied
                      ? "Desmarcar como estudado"
                      : "Marcar como estudado"
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {activeStudied ? (
                      <path d="M5 13l4 4L19 7" />
                    ) : (
                      <circle cx="12" cy="12" r="8" />
                    )}
                  </svg>
                  {activeStudied ? "Estudado" : "Marcar estudado"}
                </button>
                <button onClick={() => go(-1)} disabled={currentIdx <= 0}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Anterior
                </button>
                <button
                  onClick={() => go(1)}
                  disabled={
                    !activeCollection ||
                    currentIdx >= activeCollection.items.length - 1
                  }
                >
                  Próximo
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </header>
            {loadingItem && <div className="loading">Carregando…</div>}
            {itemMd && (
              <Player
                key={activeItem.id + activeSlug}
                englishText={itemMd.english}
                portugueseText={itemMd.portuguese}
                audioSrc={activeItem.audioPath}
              />
            )}
            <p className="sr-only" role="status" aria-live="polite">
              {liveMessage}
            </p>
            <nav className="mobile-bottom-nav">
              <button onClick={() => go(-1)} disabled={currentIdx <= 0}>
                Anterior
              </button>
              <button
                className={"study-btn" + (activeStudied ? " done" : "")}
                onClick={onToggleStudied}
              >
                {activeStudied ? "Estudado" : "Marcar"}
              </button>
              <button
                onClick={() => go(1)}
                disabled={
                  !activeCollection ||
                  currentIdx >= activeCollection.items.length - 1
                }
              >
                Próximo
              </button>
            </nav>
          </>
        )}
      </main>
    </div>
  );
}
