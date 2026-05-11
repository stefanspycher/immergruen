let notes  = new Map();
let titles = new Map(); // lowercased title → id (unique titles only)

export async function loadIndex(path) {
  // `path` is relative to the deployment root (e.g. "notes.json").
  // Document-relative `./` resolution handles subdirectory deployments —
  // basename math is not needed for fetches.
  const res = await fetch('./' + path);
  if (!res.ok) throw new Error('index fetch failed: ' + path);
  const raw = await res.json();
  notes  = new Map(Object.entries(raw.notes ?? {}));
  titles = new Map(Object.entries(raw.titles ?? {}));
}

export const getNote     = id    => notes.get(id) ?? null;
export const hasNote     = id    => notes.has(id);
export const findByTitle = title => titles.get(title.toLowerCase()) ?? null;
export const allNotes    = ()    => notes;
