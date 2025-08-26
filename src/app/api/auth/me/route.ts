import { NextRequest, NextResponse } from 'next/server'
import { getUserById } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session-id')?.value
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 401 }
      )
    }
    
    // Extrair ID do usuário da sessão
    const userId = sessionId.split('_')[1]
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401 }
      )
    }
    
    // Buscar usuário
    const user = await getUserById(userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      )
    }
    
    // Retornar dados do usuário
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company
      }
    })
    
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
