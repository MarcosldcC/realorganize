import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/', '/login', '/register']
  const isPublicRoute = publicRoutes.some(route => pathname === route)
  
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // APIs de autenticação não precisam de verificação
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }
  
  // Para rotas protegidas (dashboard, etc.), verificar sessão
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    const sessionId = request.cookies.get('session-id')?.value
    
    if (!sessionId) {
      // Se for rota da API, retornar erro
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 401 }
        )
      }
      
      // Se for rota do dashboard, redirecionar para login
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Verificar se a sessão tem formato válido
    const parts = sessionId.split('_')
    if (parts.length < 2) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Sessão inválida' },
          { status: 401 }
        )
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
