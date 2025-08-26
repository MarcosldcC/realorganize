import { NextRequest, NextResponse } from 'next/server'
import { createCompany, createUser, getUserByEmail } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const { companyName, name, email, password } = await request.json()
    
    // Validação básica
    if (!companyName || !name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }
    
    // Verificar se o email já existe
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 400 }
      )
    }
    
    // Criar empresa
    const company = await createCompany(companyName, email)
    
    // Criar usuário
    const user = await createUser(email, password, name, company.id)
    
    // Retornar sucesso
    return NextResponse.json({
      message: 'Usuário criado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company
      }
    })
    
  } catch (error) {
    console.error('Erro no registro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
