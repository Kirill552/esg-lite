import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
// Временно отключен rate-limiter в middleware для избежания проблем с Node.js модулями
// import { getRateLimiter } from '@/lib/rate-limiter'

const isProtectedRoute = createRouteMatcher([
  '/dashboard',
  '/upload', 
  '/reports',
  '/documents',
  '/api/upload',
  '/api/ocr',
  '/api/reports',
  '/api/documents'
])

const isRateLimitedRoute = createRouteMatcher([
  '/api/ocr',
  '/api/upload'
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth()
  const { pathname } = req.nextUrl

  // Если пользователь авторизован и находится на главной странице - перенаправляем на dashboard
  if (userId && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Защищаем приватные маршруты
  if (isProtectedRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Rate limiting временно отключен - будет реализован в самих API роутах
  // чтобы избежать проблем с импортом Node.js модулей в middleware
  /*
  if (isRateLimitedRoute(req) && userId) {
    // Rate limiting логика перенесена в API роуты
  }
  */

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
} 