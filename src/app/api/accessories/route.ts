import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const accessories = await prisma.accessory.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(accessories)
  } catch (error) {
    console.error('Erro ao buscar acessórios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando criação de acessório...')
    
    const body = await request.json()
    console.log('Dados recebidos:', body)
    
    const { name, code, description, totalQty, pricePerUnit } = body

    // Validação dos campos obrigatórios
    if (!name || !code || totalQty === undefined || pricePerUnit === undefined) {
      console.log('Validação falhou:', { name, code, totalQty, pricePerUnit })
      return NextResponse.json(
        { error: 'Nome, código, quantidade total e preço por unidade são obrigatórios' },
        { status: 400 }
      )
    }

    // Validação de tipos
    if (typeof totalQty !== 'number' && isNaN(parseInt(totalQty))) {
      console.log('totalQty inválido:', totalQty)
      return NextResponse.json(
        { error: 'Quantidade total deve ser um número válido' },
        { status: 400 }
      )
    }

    if (typeof pricePerUnit !== 'number' && isNaN(parseFloat(pricePerUnit))) {
      console.log('pricePerUnit inválido:', pricePerUnit)
      return NextResponse.json(
        { error: 'Preço por unidade deve ser um número válido' },
        { status: 400 }
      )
    }

    console.log('Dados validados, criando acessório...')
    
    const accessory = await prisma.accessory.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        totalQty: parseInt(totalQty),
        pricePerUnit: parseFloat(pricePerUnit)
      }
    })

    console.log('Acessório criado com sucesso:', accessory)
    return NextResponse.json(accessory, { status: 201 })
    
  } catch (error) {
    console.error('Erro detalhado ao criar acessório:', error)
    
    if (error instanceof Error) {
      console.error('Mensagem de erro:', error.message)
      console.error('Stack trace:', error.stack)
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Código já está em uso' },
          { status: 409 }
        )
      }
      
      if (error.message.includes('Invalid value')) {
        return NextResponse.json(
          { error: 'Dados inválidos fornecidos' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
