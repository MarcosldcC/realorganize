import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id }
    })
    
    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(client)
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar se o documento já existe (se fornecido)
    if (body.document?.trim()) {
      const existingClient = await prisma.client.findFirst({
        where: { 
          document: body.document.trim(),
          id: { not: params.id }
        }
      })

      if (existingClient) {
        return NextResponse.json(
          { error: 'Documento já cadastrado no sistema' },
          { status: 409 }
        )
      }
    }
    
    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone.trim(),
        document: body.document.trim(),
        company: body.company?.trim() || null,
        address: body.address?.trim() || null
      }
    })
    
    return NextResponse.json(client)
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.client.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Cliente deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
