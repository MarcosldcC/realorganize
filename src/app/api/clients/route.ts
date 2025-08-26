import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Função para obter companyId da sessão
async function getCompanyIdFromSession(request: NextRequest): Promise<string | null> {
  try {
    const sessionId = request.cookies.get('session-id')?.value
    if (!sessionId) return null
    
    const parts = sessionId.split('_')
    if (parts.length < 2) return null
    
    const userId = parts[1]
    if (!userId) return null
    
    // Buscar usuário para obter companyId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    })
    
    return user?.companyId || null
  } catch (error) {
    console.error('Erro ao obter companyId:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyIdFromSession(request)
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    const clients = await prisma.client.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validação dos campos obrigatórios
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    if (!body.phone?.trim()) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      )
    }

    if (!body.document?.trim()) {
      return NextResponse.json(
        { error: 'CPF/CNPJ é obrigatório' },
        { status: 400 }
      )
    }

    const companyId = await getCompanyIdFromSession(request)
    if (!companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Verificar se o documento já existe na empresa (se fornecido)
    if (body.document?.trim()) {
      const existingClient = await prisma.client.findFirst({
        where: { 
          document: body.document.trim(),
          companyId
        }
      })

      if (existingClient) {
        return NextResponse.json(
          { error: 'Documento já cadastrado nesta empresa' },
          { status: 409 }
        )
      }
    }
    
    const client = await prisma.client.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone.trim(),
        document: body.document.trim(),
        company: body.company?.trim() || null,
        address: body.address?.trim() || null,
        companyId
      }
    })
    
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Documento já cadastrado no sistema' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
