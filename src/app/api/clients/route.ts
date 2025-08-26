import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
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
    if (!body.name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o documento já existe (se fornecido)
    if (body.document?.trim()) {
      const existingClient = await prisma.client.findFirst({
        where: { 
          document: body.document.trim()
        }
      })

      if (existingClient) {
        return NextResponse.json(
          { error: 'Documento já cadastrado no sistema' },
          { status: 409 }
        )
      }
    }
    
    const client = await prisma.client.create({
      data: {
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        document: body.document?.trim() || null,
        company: body.company?.trim() || null,
        address: body.address?.trim() || null
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
