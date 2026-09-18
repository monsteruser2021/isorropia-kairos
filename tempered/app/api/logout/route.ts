import { NextRequest, NextResponse } from 'next/server';
import cookie from 'cookie';

const TOKEN_NAME = 'tempered_token';

export async function POST(_req: NextRequest) {
  const serialized = cookie.serialize(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });

  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', serialized);
  return res;
}
