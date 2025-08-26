import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    const token = generateToken({
      userId: user.id,
      email: user.email
    })

    const response = NextResponse.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    })

    // Definir cookie com o token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    })

    return response
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
