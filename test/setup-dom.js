import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import React from "react";

vi.mock("next/image", () => ({
  default: function MockImage({ src, alt, onLoad, className }) {
    return React.createElement("img", { src, alt, onLoad, className });
  },
}));
vi.mock("next/head", () => ({ default: () => null }));
vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null }));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

if (globalThis.jsdom) {
  Object.defineProperty(globalThis, "localStorage", {
    value: globalThis.jsdom.window.localStorage,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
  globalThis.jsdom?.window.localStorage.clear();
});
