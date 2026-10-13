const attempts = new Map<string, { count: number; expires: number }>();
export function loginBlocked(key: string, now = Date.now()) {
  const entry = attempts.get(key); return !!entry && entry.expires > now && entry.count >= 5;
}
export function recordLoginFailure(key: string, now = Date.now()) {
  for (const [k, entry] of attempts) if (entry.expires <= now) attempts.delete(k);
  if (attempts.size > 10000) attempts.delete(attempts.keys().next().value!);
  const entry = attempts.get(key);
  attempts.set(key, { count: entry && entry.expires > now ? entry.count + 1 : 1, expires: entry && entry.expires > now ? entry.expires : now + 15 * 60 * 1000 });
}
export function clearLoginFailures(key: string) { attempts.delete(key); }
