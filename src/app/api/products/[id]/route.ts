import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PUT - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Atualizando produto ID:', params.id)
    
    const body = await request.json()
    console.log('Dados recebidos para atualização:', body)
    
    const { name, code, totalMeters, pricePerMeter } = body

    if (!name || !code || totalMeters === undefined || pricePerMeter === undefined) {
      console.log('Validação falhou na atualização:', { name, code, totalMeters, pricePerMeter })
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o código já existe em outro produto
    const existingProduct = await prisma.product.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        id: { not: params.id }
      }
    })

    if (existingProduct) {
      console.log('Código já existe em outro produto:', code)
      return NextResponse.json(
        { error: 'Código já existe' },
        { status: 400 }
      )
    }

    console.log('Atualizando produto no banco...')
    
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        totalMeters: parseInt(totalMeters),
        pricePerMeter: parseFloat(pricePerMeter),
        updatedAt: new Date()
      }
    })

    console.log('Produto atualizado com sucesso:', product)
    return NextResponse.json(product)
    
  } catch (error) {
    console.error('Erro detalhado ao atualizar produto:', error)
    
    if (error instanceof Error) {
      console.error('Mensagem de erro:', error.message)
      console.error('Stack trace:', error.stack)
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Excluindo produto ID:', params.id)
    
    await prisma.product.delete({
      where: { id: params.id }
    })

    console.log('Produto excluído com sucesso')
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erro detalhado ao excluir produto:', error)
    
    if (error instanceof Error) {
      console.error('Mensagem de erro:', error.message)
      console.error('Stack trace:', error.stack)
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
