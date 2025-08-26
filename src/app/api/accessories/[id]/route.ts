import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accessory = await prisma.accessory.findUnique({
      where: { id: params.id }
    })

    if (!accessory) {
      return NextResponse.json(
        { error: 'Acessório não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(accessory)
  } catch (error) {
    console.error('Erro ao buscar acessório:', error)
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
    console.log('Atualizando acessório ID:', params.id)
    
    const body = await request.json()
    console.log('Dados recebidos para atualização:', body)
    
    const { name, code, totalQty, pricePerUnit } = body

    if (!name || !code || totalQty === undefined || pricePerUnit === undefined) {
      console.log('Validação falhou na atualização:', { name, code, totalQty, pricePerUnit })
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o código já existe em outro acessório
    const existingAccessory = await prisma.accessory.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        id: { not: params.id }
      }
    })

    if (existingAccessory) {
      console.log('Código já existe em outro acessório:', code)
      return NextResponse.json(
        { error: 'Código já existe' },
        { status: 400 }
      )
    }

    console.log('Atualizando acessório no banco...')
    
    const accessory = await prisma.accessory.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        totalQty: parseInt(totalQty),
        pricePerUnit: parseFloat(pricePerUnit)
      }
    })

    console.log('Acessório atualizado com sucesso:', accessory)
    return NextResponse.json(accessory)
    
  } catch (error) {
    console.error('Erro detalhado ao atualizar acessório:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Excluindo acessório ID:', params.id)
    
    // Verificar se o acessório está sendo usado em alguma locação
    const bookingAccessories = await prisma.bookingAccessory.findMany({
      where: { accessoryId: params.id }
    })

    if (bookingAccessories.length > 0) {
      console.log('Acessório está sendo usado em locações:', bookingAccessories.length)
      return NextResponse.json(
        { error: 'Não é possível excluir um acessório que está sendo usado em locações' },
        { status: 400 }
      )
    }

    await prisma.accessory.delete({
      where: { id: params.id }
    })

    console.log('Acessório excluído com sucesso')
    return NextResponse.json({ message: 'Acessório excluído com sucesso' })
    
  } catch (error) {
    console.error('Erro detalhado ao excluir acessório:', error)
    
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
