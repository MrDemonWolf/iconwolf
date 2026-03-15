interface SessionResult {
  name: string;
  width: number;
  height: number;
  size: number;
  base64: string;
}

interface Session {
  results: SessionResult[];
  createdAt: number;
}

const SESSION_TTL = 5 * 60 * 1000; // 5 minutes
const sessions = new Map<string, Session>();

export function createSession(id: string, results: SessionResult[]): void {
  sessions.set(id, { results, createdAt: Date.now() });
}

export function getSession(id: string): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(id);
    return undefined;
  }
  return session;
}

export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL) {
      sessions.delete(id);
    }
  }
}
