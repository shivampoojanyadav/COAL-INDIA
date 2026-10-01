export type ClassValue = string | number | null | false | undefined

/** Minimal classname joiner — avoids pulling in clsx for a 10-line helper. */
export function cn(...parts: ClassValue[]): string {
  const out: string[] = []
  for (const p of parts) {
    if (!p && p !== 0) continue
    out.push(String(p))
  }
  return out.join(' ')
}
