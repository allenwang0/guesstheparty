export function normalizePoliticians(data) {
  if (!Array.isArray(data)) throw new Error("politicians.json must be a JSON array.");
  const normalized = data.map((p, idx) => ({
    ...p,
    imageUrl: p?.img,
    id: `${p?.name}-${p?.party}-${p?.state || ""}-${idx}`,
  }));
  if (normalized.some((p) => !p.imageUrl || !p.party || !p.name)) {
    throw new Error("Every entry must include name, party, and img.");
  }
  return normalized;
}

export function formatOffice(p, revealed) {
  const c = (p?.category ?? "").toString().trim().toLowerCase();
  let base = "Public Official";
  if (c === "house") base = "Representative";
  if (c === "senate") base = "Senator";
  if (c === "gov") base = "Governor";
  if (!revealed) return base;
  if (p?.state) return `${base} • ${p.state}`;
  return base;
}
