import politicians from "../public/politicians.json";

export const MEMBERS = politicians;
export const MEMBERS_BY_ID = new Map(politicians.map((p) => [p.id, p]));
