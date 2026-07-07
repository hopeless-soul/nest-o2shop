import { Request } from 'express';

// express's Request type has no `cookies` field — cookie-parser attaches it
// at runtime without a corresponding type augmentation in this repo, so the
// cast here is required to read it without going through `any`.
export function extractCookie(request: Request, name: string): string | null {
  const cookies = request.cookies as Record<string, string> | undefined;
  return cookies?.[name] ?? null;
}
