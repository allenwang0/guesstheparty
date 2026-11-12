import { useEffect, useState } from "react";

let warned = false;

function warnOnce(error) {
  if (warned) return;
  warned = true;
  console.warn("localStorage is unavailable; progress will not be saved.", error);
}

export function readStorage(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    warnOnce(error);
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    warnOnce(error);
  }
}

export function parseJson(raw) {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    console.warn("Ignoring unreadable saved data.", error);
    return null;
  }
}

export function usePersistentState(key, load) {
  const [value, setValue] = useState(() => load(readStorage(key)));
  useEffect(() => {
    writeStorage(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}
