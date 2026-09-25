/**
 * Escape a value before putting it inside an HTML string (SweetAlert `html:`,
 * document.write, ...). Names, titles and file names come from users — an
 * employee can put `<img onerror=...>` in their own name — so every
 * interpolated value MUST go through this. React JSX already escapes; this is
 * only for the places that build raw HTML strings.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SAFE_IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\s]*$/i;
const SAFE_PDF_DATA_URL = /^data:application\/pdf;base64,[A-Za-z0-9+/=\s]*$/i;

/**
 * Which kind of inline preview a stored attachment may get. Only well-formed
 * base64 data URLs of an image or a PDF qualify; anything else (another type,
 * a URL with quotes or script, `javascript:`) is never embedded.
 */
export function safeDataUrlKind(url: string | null | undefined): 'image' | 'pdf' | null {
  if (!url) return null;
  if (SAFE_IMAGE_DATA_URL.test(url)) return 'image';
  if (SAFE_PDF_DATA_URL.test(url)) return 'pdf';
  return null;
}
