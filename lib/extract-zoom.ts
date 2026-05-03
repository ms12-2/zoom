/**
 * First Zoom join URL in free text (WhatsApp, etc.). Returns null if none.
 */
export function extractFirstZoomUrl(text: string): string | null {
  const s = (text || "").trim();
  if (!s) return null;
  const patterns = [
    /https?:\/\/[a-z0-9.-]*zoom\.us\/j\/\d+[^\s'")>\]]*/gi,
    /https?:\/\/[a-z0-9.-]*zoom\.us\/my\/[^\s'")>\]]+/gi,
    /https?:\/\/[a-z0-9.-]*zoom\.us\/wc\/join\/[^\s'")>\]]+/gi,
    /https?:\/\/[a-z0-9.-]*zoom\.us\/join\?[^\s'")>\]]+/gi,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m?.[0]) {
      return m[0].replace(/[.,;]+$/, "");
    }
  }
  return null;
}
