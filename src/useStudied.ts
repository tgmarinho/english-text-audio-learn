import { useCallback, useEffect, useState } from "react";

const KEY = "english-study.studied.v1";

type StudiedMap = Record<string, true>;

function load(): StudiedMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function key(slug: string, id: string) {
  return `${slug}/${id}`;
}

export function useStudied() {
  const [studied, setStudied] = useState<StudiedMap>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(studied));
    } catch {
      // ignore quota errors
    }
  }, [studied]);

  const isStudied = useCallback(
    (slug: string, id: string) => studied[key(slug, id)] === true,
    [studied],
  );

  const toggle = useCallback((slug: string, id: string) => {
    setStudied((prev) => {
      const k = key(slug, id);
      const next = { ...prev };
      if (next[k]) delete next[k];
      else next[k] = true;
      return next;
    });
  }, []);

  const countFor = useCallback(
    (slug: string) => {
      const prefix = `${slug}/`;
      let n = 0;
      for (const k in studied) if (k.startsWith(prefix)) n++;
      return n;
    },
    [studied],
  );

  return { isStudied, toggle, countFor };
}
