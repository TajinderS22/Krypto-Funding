import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has('accessToken') || request.cookies.has('refreshToken');

  if (pathname.startsWith('/client') && !hasToken) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  if (pathname.startsWith('/admin/dashboard') && !hasToken) {
    return NextResponse.redirect(new URL('/admin/auth/signin', request.url));
  }

  if (hasToken) {
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
