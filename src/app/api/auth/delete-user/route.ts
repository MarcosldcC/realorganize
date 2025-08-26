import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Deletar usuário do banco local
    const deletedUser = await prisma.user.delete({
      where: { email }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso',
      user: deletedUser
    })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar usuário' },
      { status: 500 }
    )
  }
}
