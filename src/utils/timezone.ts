export function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function isValidTimeZone(timeZone: string | null | undefined) {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function resolveDisplayTimeZone(...candidates: Array<string | null | undefined>) {
  return candidates.find(isValidTimeZone) || getBrowserTimeZone();
}

export function formatTimeDateInTimeZone(value: string | null | undefined, timeZone?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const resolvedTimeZone = resolveDisplayTimeZone(timeZone);
  const time = date.toLocaleTimeString('en-US', {
    timeZone: resolvedTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const day = date.toLocaleDateString('en-US', {
    timeZone: resolvedTimeZone,
    day: '2-digit',
    month: 'short',
  });
  return `${time}, ${day}`;
}
