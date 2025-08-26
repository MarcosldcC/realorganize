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
    
    const products = await prisma.product.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando criação de produto...')
    
    const companyId = await getCompanyIdFromSession(request)
    const body = await request.json()
    console.log('Dados recebidos:', body)
    
    const { name, code, description, totalMeters, pricePerMeter } = body

    // Validação dos campos obrigatórios
    if (!name || !code || totalMeters === undefined || pricePerMeter === undefined) {
      console.log('Validação falhou:', { name, code, totalMeters, pricePerMeter })
      return NextResponse.json(
        { error: 'Nome, código, metros totais e preço por metro são obrigatórios' },
        { status: 400 }
      )
    }

    // Validação de tipos
    if (typeof totalMeters !== 'number' && isNaN(parseInt(totalMeters))) {
      console.log('totalMeters inválido:', totalMeters)
      return NextResponse.json(
        { error: 'Metros totais deve ser um número válido' },
        { status: 400 }
      )
    }

    if (typeof pricePerMeter !== 'number' && isNaN(parseFloat(pricePerMeter))) {
      console.log('pricePerMeter inválido:', pricePerMeter)
      return NextResponse.json(
        { error: 'Preço por metro deve ser um número válido' },
        { status: 400 }
      )
    }

    console.log('Dados validados, criando produto...')
    
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        totalMeters: parseInt(totalMeters),
        pricePerMeter: parseFloat(pricePerMeter),
        companyId
      }
    })

    console.log('Produto criado com sucesso:', product)
    return NextResponse.json(product, { status: 201 })
    
  } catch (error) {
    console.error('Erro detalhado ao criar produto:', error)
    
    if (error instanceof Error) {
      console.error('Mensagem de erro:', error.message)
      console.error('Stack trace:', error.stack)
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Código já está em uso nesta empresa' },
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
