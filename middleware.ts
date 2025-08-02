import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Rate-limiter теперь реализован непосредственно в API роутах
// для лучшей производительности и совместимости с Edge Runtime

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

  // Rate limiting реализован непосредственно в API роутах (/api/upload, /api/ocr)
  // для обеспечения лучшей производительности и точности контроля
  // См. app/api/upload/route.ts для реализации rate-limiting

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