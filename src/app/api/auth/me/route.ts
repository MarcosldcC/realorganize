import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email
      }
    })
  } catch (error) {
    console.error('Erro ao verificar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
