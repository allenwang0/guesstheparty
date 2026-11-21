export function normalizePoliticians(data) {
  if (!Array.isArray(data)) throw new Error("politicians.json must be a JSON array.");
  const normalized = data.map((p) => ({
    ...p,
    imageUrl: p?.img,
  }));
  if (normalized.some((p) => !p.id || !p.imageUrl || !p.party || !p.name)) {
    throw new Error("Every entry must include id, name, party, and img.");
  }
  return normalized;
}

export function formatOffice(p, revealed) {
  const c = (p?.category ?? "").toString().trim().toLowerCase();
  let base = "Public Official";
  if (c === "house") base = "Representative";
  if (c === "senate") base = "Senator";
  if (p?.office) base = p.office;
  if (!revealed) return base;
  if (p?.office && p?.district) return `${base} • District ${p.district}`;
  if (p?.state) return `${base} • ${p.state}`;
  return base;
}
