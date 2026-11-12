import { vi } from "vitest";

export const POLITICIANS = [
  {
    id: "T000001",
    name: "Member One",
    party: "Republican",
    state: "TX",
    category: "house",
    img: "/images/one.webp",
  },
  {
    id: "T000002",
    name: "Member Two",
    party: "Republican",
    state: "OH",
    category: "house",
    img: "/images/two.webp",
  },
  {
    id: "T000003",
    name: "Member Three",
    party: "Republican",
    state: "FL",
    category: "senate",
    img: "/images/three.webp",
  },
  {
    id: "T000004",
    name: "Member Four",
    party: "Republican",
    state: "UT",
    category: "house",
    img: "/images/four.webp",
  },
];

export function installFetch(politicians = POLITICIANS) {
  const fetchMock = vi.fn(async (url) => {
    if (url === "/politicians.json") return new Response(JSON.stringify(politicians));
    if (url === "/api/get-distribution") {
      return new Response(JSON.stringify({ total: 0, buckets: [] }));
    }
    return new Response(JSON.stringify({}));
  });
  globalThis.fetch = fetchMock;
  return fetchMock;
}

export function posts(fetchMock, path) {
  return fetchMock.mock.calls.filter(([url, init]) => url === path && init?.method === "POST");
}
