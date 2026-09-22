export function hostnameFromUrl(url?: string): string | null {
  if (!url?.trim()) return null;
  try {
    const href = url.includes("://") ? url : `https://${url}`;
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function faviconImUrl(hostname: string): string {
  return `https://a.favicon.im/${encodeURIComponent(hostname)}?larger=true&throw-error-on-404=true`;
}
