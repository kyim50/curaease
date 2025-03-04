// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the path from the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/' || 
    path.startsWith('/auth/') || 
    path === '/dashboard' || 
    path === '/appointments' ||
    path === '/symptom-checker' ||
    path === '/health-info' ||
    path === '/medications'||
    path === '/profile';
  
  // Get the authentication token from cookies
  const token = request.cookies.get('authToken')?.value;
  
  // If the user is accessing a protected route without authentication, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // If the user is accessing auth pages while already authenticated, redirect to dashboard
  if (token && (path.startsWith('/auth/') || path === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Continue with the request otherwise
  return NextResponse.next();
}

// Run middleware on specific paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};