import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Autenticar usuário
    const user = await authenticateUser(email, password)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }
    
    // Criar sessão simples (em produção, use JWT ou session)
    const sessionId = `session_${user.id}_${Date.now()}`
    
    // Retornar sucesso com dados do usuário
    const response = NextResponse.json({
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company
      },
      sessionId
    })
    
    // Definir cookie de sessão
    response.cookies.set('session-id', sessionId, {
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
