export async function loadConfig() {
  const res = await fetch('./config.json');
  if (!res.ok) throw new Error('config.json missing');
  return res.json();
  // { title, indexPath, bookmarks: [id, ...], basename?: '/repo' }
}
