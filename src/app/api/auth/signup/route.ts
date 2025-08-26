import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Criar usuário no banco
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0], // Usar nome ou parte do email
        password: password || 'temp_password', // Campo obrigatório

      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
