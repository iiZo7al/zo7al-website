import 'server-only';
import { timingSafeEqual } from 'node:crypto';

// Supabase speaks standard OAuth. Modrinth expects raw Authorization values.
// Keep this member integration separate from the administrator's Modrinth app.
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
const agent = 'Zo7alProjects/1.0 (https://zo7al.is-a.dev)';
function equals(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function credentials() {
  const id = process.env.MODRINTH_MEMBER_CLIENT_ID, secret = process.env.MODRINTH_MEMBER_CLIENT_SECRET;
  if (!id || !secret || !/^[A-Za-z0-9_-]{8,128}$/.test(id) || !/^[\x21-\x7e]{16,256}$/.test(secret)) return null;
  const origin = new URL(process.env.SUPABASE_URL ?? '');
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/') return null;
  return { id, secret, redirect: origin.origin + '/auth/v1/callback' };
}
function failure(error: string, status: number) { return Response.json({ error }, { status, headers }); }
async function modrinthResponse(response: Response) {
  if (!response.ok) return null;
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.length; if (size > 32000) return null;
      chunks.push(chunk.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString()) as Record<string, unknown>;
  } finally { await reader.cancel(); }
}
export async function modrinthToken(request: Request) {
  try {
    const app = credentials(); if (!app) return failure('temporarily_unavailable', 503);
    if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return failure('invalid_request', 400);
    const reader=request.body?.getReader();if(!reader)return failure('invalid_request',400);
    const chunks:Uint8Array[]=[];let length=0;
    try {while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>8192)return failure('invalid_request',413);chunks.push(part.value);}}finally{await reader.cancel();}
    const text=Buffer.concat(chunks).toString();
    const form = new URLSearchParams(text);
    let id = form.get('client_id') ?? '', secret = form.get('client_secret') ?? '';
    const basic = request.headers.get('authorization');
    if (basic?.startsWith('Basic ')) {
      const pair = Buffer.from(basic.slice(6), 'base64').toString(), index = pair.indexOf(':');
      if (index < 0) return failure('invalid_client', 401);
      id = decodeURIComponent(pair.slice(0, index).replaceAll('+', ' '));
      secret = decodeURIComponent(pair.slice(index + 1).replaceAll('+', ' '));
    }
    if (!equals(id, app.id) || !equals(secret, app.secret)) return failure('invalid_client', 401);
    const code = form.get('code');
    if (form.get('grant_type') !== 'authorization_code' || form.get('redirect_uri') !== app.redirect || !code || code.length > 4096 || /[\x00-\x20\x7f]/.test(code)) return failure('invalid_grant', 400);
    const body = new URLSearchParams({ client_id: app.id, grant_type: 'authorization_code', code, redirect_uri: app.redirect });
    const verifier = form.get('code_verifier'); if (verifier) body.set('code_verifier', verifier);
    const response = await fetch('https://api.modrinth.com/_internal/oauth/token', { method: 'POST', headers: { Authorization: app.secret, 'User-Agent': agent }, body, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12000) });
    if (response.status === 400 || response.status === 401) return failure('invalid_grant', 400);
    const data = await modrinthResponse(response);
    if (typeof data?.access_token !== 'string' || !/^[\x21-\x7e]{1,4096}$/.test(data.access_token)) return failure('temporarily_unavailable', 503);
    return Response.json({ access_token: data.access_token, token_type: 'Bearer', ...(typeof data.expires_in === 'number' ? { expires_in: data.expires_in } : {}), ...(typeof data.scope === 'string' ? { scope: data.scope } : {}) }, { headers });
  } catch { return failure('temporarily_unavailable', 503); }
}
export async function modrinthUserinfo(request: Request) {
  try {
    const token = request.headers.get('authorization')?.match(/^Bearer ([\x21-\x7e]{1,4096})$/i)?.[1];
    if (!token) return failure('invalid_token', 401);
    const response = await fetch('https://api.modrinth.com/v2/user', { headers: { Authorization: token, 'User-Agent': agent }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12000) });
    if (response.status === 401 || response.status === 403) return failure('invalid_token', 401);
    const user = await modrinthResponse(response);
    if (typeof user?.id !== 'string' || typeof user.username !== 'string' || typeof user.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) return failure('insufficient_scope', 403);
    return Response.json({ sub: user.id, name: user.username, preferred_username: user.username, email: user.email, email_verified: user.email_verified === true, ...(typeof user.avatar_url === 'string' && user.avatar_url.startsWith('https://') ? { picture: user.avatar_url, avatar_url: user.avatar_url } : {}) }, { headers });
  } catch { return failure('temporarily_unavailable', 503); }
}
