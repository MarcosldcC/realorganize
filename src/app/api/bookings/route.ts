import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { InventoryService } from '@/lib/inventory'

export async function GET() {
  try {
    const bookings = await (prisma as any).booking.findMany({
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        },
        items: {
          include: {
            product: true
          }
        },
        accessories: {
          include: {
            accessory: true
          }
        },
        equipment: {
          include: {
            equipment: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Erro ao buscar locações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando criação de booking...')
    
    const body = await request.json()
    console.log('Dados recebidos:', body)
    
    const { products, accessories, equipment, ...bookingData } = body
    
    // Validação dos dados obrigatórios
    if (!bookingData.clientId || !bookingData.startDate || !bookingData.endDate || !bookingData.eventTitle) {
      console.log('Validação falhou:', { 
        clientId: !!bookingData.clientId, 
        startDate: !!bookingData.startDate, 
        endDate: !!bookingData.endDate, 
        eventTitle: !!bookingData.eventTitle,
        receivedData: bookingData
      })
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos', 
          missingFields: {
            clientId: !bookingData.clientId,
            startDate: !bookingData.startDate,
            endDate: !bookingData.endDate,
            eventTitle: !bookingData.eventTitle
          }
        },
        { status: 400 }
      )
    }

    // Validação das datas
    try {
      const startDate = new Date(bookingData.startDate)
      const endDate = new Date(bookingData.endDate)
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Datas inválidas fornecidas' },
          { status: 400 }
        )
      }
      
      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'A data de início deve ser anterior à data de fim' },
          { status: 400 }
        )
      }
    } catch (dateError) {
      return NextResponse.json(
        { error: 'Erro ao processar as datas' },
        { status: 400 }
      )
    }

    // Verificar se o cliente existe
    try {
      const client = await prisma.client.findUnique({
        where: { id: bookingData.clientId }
      })
      
      if (!client) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 400 }
        )
      }
    } catch (clientError) {
      console.error('Erro ao verificar cliente:', clientError)
      return NextResponse.json(
        { error: 'Erro ao verificar cliente' },
        { status: 400 }
      )
    }

    // Validar disponibilidade de estoque para o período específico
    try {
      const startDate = new Date(bookingData.startDate)
      const endDate = new Date(bookingData.endDate)
      
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/availability/check-advanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          products: products.filter((p: any) => p.productId && p.meters > 0),
          accessories: accessories.filter((a: any) => a.accessoryId && a.qty > 0),
          equipment: equipment.filter((e: any) => e.equipmentId && e.qty > 0)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return NextResponse.json(
          { error: 'Erro ao validar disponibilidade do estoque', details: errorData },
          { status: 500 }
        )
      }

      const availabilityData = await response.json()
      
      if (!availabilityData.available) {
        return NextResponse.json(
          {
            error: 'Estoque insuficiente para o período solicitado',
            conflicts: availabilityData.conflicts,
            periodAvailability: availabilityData.periodAvailability
          },
          { status: 400 }
        )
      }

      console.log('✅ Validação de disponibilidade aprovada para o período')
    } catch (inventoryError) {
      console.error('Erro ao validar estoque:', inventoryError)
      return NextResponse.json(
        { error: 'Erro ao validar disponibilidade do estoque' },
        { status: 500 }
      )
    }

    console.log('Criando booking...')
    const booking = await (prisma as any).booking.create({
      data: {
        clientId: bookingData.clientId,
        startDate: new Date(bookingData.startDate),
        endDate: new Date(bookingData.endDate),
        eventTitle: bookingData.eventTitle,
        eventAddress: bookingData.eventAddress || '',
        totalValue: parseFloat(bookingData.totalValue || bookingData.totalPrice || '0'),
        status: (bookingData.status as any) || 'PENDING',
        paymentStatus: (bookingData.paymentStatus as any) || 'PENDING',
        notes: bookingData.notes || ''
      }
    })

    console.log('Booking criado:', booking)

    // Criar itens de produtos - com validação de array vazio
    if (products && Array.isArray(products) && products.length > 0) {
      console.log('Criando itens de produtos:', products)
      try {
        await Promise.all(
          products.map((product: any) =>
            prisma.bookingItem.create({
              data: {
                bookingId: booking.id,
                productId: product.productId,
                meters: parseInt(product.meters) || 1,
                price: 0.00
              }
            })
          )
        )
        console.log('Itens de produtos criados com sucesso')
      } catch (productError) {
        console.error('Erro ao criar itens de produtos:', productError)
        // Não falha a criação do booking por erro nos produtos
      }
    } else {
      console.log('Nenhum produto selecionado - pulando criação de itens de produtos')
    }

    // Criar itens de acessórios - com validação de array vazio
    if (accessories && Array.isArray(accessories) && accessories.length > 0) {
      console.log('Criando itens de acessórios:', accessories)
      try {
        await Promise.all(
          accessories.map((accessory: any) =>
            prisma.bookingAccessory.create({
              data: {
                bookingId: booking.id,
                accessoryId: accessory.accessoryId,
                qty: parseInt(accessory.qty) || 1,
                price: 0.00
              }
            })
          )
        )
        console.log('Itens de acessórios criados com sucesso')
      } catch (accessoryError) {
        console.error('Erro ao criar itens de acessórios:', accessoryError)
        // Não falha a criação do booking por erro nos acessórios
      }
    } else {
      console.log('Nenhum acessório selecionado - pulando criação de itens de acessórios')
    }

    // Criar itens de equipamentos - com validação de array vazio
    if (equipment && Array.isArray(equipment) && equipment.length > 0) {
      console.log('Criando itens de equipamentos:', equipment)
      try {
        await Promise.all(
          equipment.map((equip: any) =>
            (prisma as any).bookingEquipment.create({
              data: {
                bookingId: booking.id,
                equipmentId: equip.equipmentId,
                qty: parseInt(equip.qty) || 1,
                price: 0.00
              }
            })
          )
        )
        console.log('Itens de equipamentos criados com sucesso')
      } catch (equipmentError) {
        console.error('Erro ao criar itens de equipamentos:', equipmentError)
        // Não falha a criação do booking por erro nos equipamentos
      }
    } else {
      console.log('Nenhum equipamento selecionado - pulando criação de itens de equipamentos')
    }
    
    console.log('Booking criado com sucesso:', booking.id)
    
    // Atualizar estoque automaticamente
    try {
      await InventoryService.updateInventoryOnBookingCreate(booking.id)
      console.log('Estoque atualizado automaticamente')
    } catch (inventoryError) {
      console.error('Erro ao atualizar estoque:', inventoryError)
      // Não falha a criação da locação por erro no estoque
    }
    
    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar locação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
