/**
 * Auth flow example: register → login → fetch own profile
 * Run: npx ts-node specs/examples/typescript/auth.ts
 */

const BASE = 'http://localhost:3001';

async function register(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Register failed: ${JSON.stringify(err)}`);
  }
  return res.json();
}

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Login failed: ${JSON.stringify(err)}`);
  }
  const body = await res.json();
  return body.access_token as string;
}

async function getMe(token: string) {
  const res = await fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET /me failed: ${res.status}`);
  return res.json();
}

async function main() {
  const email = `demo+${Date.now()}@example.com`;
  const password = 'StrongPass1!';

  console.log('Registering…');
  const user = await register(email, password);
  console.log('Registered:', user);

  console.log('\nLogging in…');
  const token = await login(email, password);
  console.log('access_token:', token.slice(0, 40) + '…');

  console.log('\nFetching /me…');
  const me = await getMe(token);
  console.log('Profile:', me);
}

main().catch(console.error);
