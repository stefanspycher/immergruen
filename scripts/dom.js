const ESC = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
export const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ESC[c]);
