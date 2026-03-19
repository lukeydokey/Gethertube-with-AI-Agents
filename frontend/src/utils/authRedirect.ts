const AUTH_RETURN_TO_KEY = "auth:returnTo";
const DEFAULT_RETURN_PATH = "/rooms";
const AUTH_ROUTE_PREFIXES = ["/login", "/auth/callback"];

interface PathParts {
  pathname: string;
  search?: string;
  hash?: string;
}

export function getDefaultReturnPath(): string {
  return DEFAULT_RETURN_PATH;
}

export function buildInternalPath({ pathname, search = "", hash = "" }: PathParts): string {
  return `${pathname}${search}${hash}`;
}

export function sanitizeInternalReturnTo(raw?: string | null): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  if (
    Array.from(trimmed).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  ) {
    return null;
  }

  try {
    const url = new URL(trimmed, window.location.origin);

    if (url.origin !== window.location.origin) {
      return null;
    }

    const normalized = `${url.pathname}${url.search}${url.hash}`;

    if (AUTH_ROUTE_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
      return null;
    }

    return normalized;
  } catch {
    return null;
  }
}

export function saveReturnTo(raw?: string | null): string | null {
  const sanitized = sanitizeInternalReturnTo(raw);

  if (!sanitized) {
    clearReturnTo();
    return null;
  }

  try {
    sessionStorage.setItem(AUTH_RETURN_TO_KEY, sanitized);
  } catch {
    return sanitized;
  }

  return sanitized;
}

export function getReturnTo(): string | null {
  try {
    return sanitizeInternalReturnTo(sessionStorage.getItem(AUTH_RETURN_TO_KEY));
  } catch {
    return null;
  }
}

export function consumeReturnTo(): string | null {
  const returnTo = getReturnTo();
  clearReturnTo();
  return returnTo;
}

export function clearReturnTo(): void {
  try {
    sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  } catch {
    // Ignore storage access failures.
  }
}

export function getCurrentInternalPath(): string {
  return buildInternalPath(window.location);
}
