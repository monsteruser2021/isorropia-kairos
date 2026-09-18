import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const PUBLIC_FILE = /\.(.*)$/;
const TOKEN_NAME = 'tempered_token';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public files and Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Allow login pages
  if (pathname === '/' || pathname === '/login') return NextResponse.next();

  const token = req.cookies.get(TOKEN_NAME)?.value;
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    jwt.verify(token, secret);
    return NextResponse.next();
  } catch (err) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
