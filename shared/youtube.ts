const youtubeIdPattern = /^[A-Za-z0-9_-]{11}$/;
const directVideoPattern = /\.(mp4|webm)$/i;

function isHttpsUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function isAllowedHost(hostname: string, hosts: readonly string[]): boolean {
  return hosts.includes(hostname.toLowerCase());
}

export function parseYouTubeId(value: string): string | null {
  const url = isHttpsUrl(value);
  if (!url) return null;
  if (url.username || url.password || (url.port && url.port !== '443')) return null;
  const hostname = url.hostname.toLowerCase();
  let candidate: string | null = null;

  if (isAllowedHost(hostname, ['youtube.com', 'www.youtube.com'])) {
    if (url.pathname === '/watch') {
      const values = url.searchParams.getAll('v');
      candidate = values.length === 1 ? values[0] : null;
    } else {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length === 2 && (parts[0] === 'embed' || parts[0] === 'shorts')) candidate = parts[1];
    }
  } else if (isAllowedHost(hostname, ['youtu.be'])) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 1) candidate = parts[0];
  } else if (isAllowedHost(hostname, ['youtube-nocookie.com', 'www.youtube-nocookie.com'])) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 2 && parts[0] === 'embed') candidate = parts[1];
  }

  return candidate && youtubeIdPattern.test(candidate) ? candidate : null;
}

export function normalizeExerciseVideoUrl(value: string): string | null {
  const trimmed = value.trim();
  const youtubeId = parseYouTubeId(trimmed);
  if (youtubeId) return `https://www.youtube.com/watch?v=${youtubeId}`;
  const url = isHttpsUrl(trimmed);
  if (url && directVideoPattern.test(url.pathname)) return url.toString();
  return null;
}

export function isSupportedExerciseVideoUrl(value: string): boolean {
  return normalizeExerciseVideoUrl(value) !== null;
}
