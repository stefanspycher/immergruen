const store = new Map();
export const get = id       => store.get(id);
export const set = (id, md) => store.set(id, md);
export const has = id       => store.has(id);
