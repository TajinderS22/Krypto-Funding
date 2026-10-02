import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccessToken = request.cookies.has('accessToken');
  const hasRefreshToken = request.cookies.has('refreshToken');
  const hasSession = hasAccessToken || hasRefreshToken;

  // Protect client routes — allow through if any token exists (refresh may still work server-side)
  if (pathname.startsWith('/client') && !hasSession) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Protect admin routes — same logic
  if (pathname.startsWith('/admin/dashboard') && !hasSession) {
    return NextResponse.redirect(new URL('/admin/auth/signin', request.url));
  }

  // Redirect away from auth pages — only if accessToken proves an active session
  if (hasAccessToken) {
    if (pathname === '/admin/auth/signin' || pathname === '/admin/auth/signup') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (pathname === '/auth/signin' || pathname === '/auth/signup') {
      return NextResponse.redirect(new URL('/client/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/client/:path*',
    '/admin/dashboard/:path*',
    '/admin/dashboard',
    '/admin/auth/signin',
    '/admin/auth/signup',
    '/auth/signin',
    '/auth/signup',
  ],
};
