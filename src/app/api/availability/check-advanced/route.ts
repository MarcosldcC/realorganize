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
      where: { id: userId }
    })
    
    return user?.companyId || null
  } catch (error) {
    console.error('Erro ao obter companyId:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startDate, endDate, products, accessories, equipment } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Datas de início e fim são obrigatórias' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json(
        { error: 'A data de início deve ser anterior à data de fim' },
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

    // Buscar locações que se sobrepõem ao período solicitado
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        companyId,
        AND: [
          { startDate: { lte: end } },
          { endDate: { gte: start } },
          { status: { in: ['CONFIRMED', 'PENDING', 'HOLD'] } }
        ]
      },
      include: {
        items: { include: { product: true } },
        accessories: { include: { accessory: true } },
        equipment: { include: { equipment: true } },
        client: { select: { name: true } }
      }
    })

    const conflicts = []
    let allAvailable = true

    // Verificar disponibilidade de produtos
    if (products && Array.isArray(products)) {
      for (const product of products) {
        if (!product.productId || !product.meters) continue

        const productInfo = await prisma.product.findUnique({
          where: { id: product.productId, companyId }
        })

        if (!productInfo) {
          conflicts.push({
            type: 'PRODUTO',
            id: product.productId,
            name: 'Produto não encontrado',
            reason: 'Produto não existe ou não pertence à empresa'
          })
          allAvailable = false
          continue
        }

        // Calcular metros ocupados no período
        const occupiedMeters = overlappingBookings.reduce((total, booking) => {
          return total + booking.items
            .filter(item => item.productId === product.productId)
            .reduce((sum, item) => sum + item.meters, 0)
        }, 0)

        const availableMeters = Math.max(0, productInfo.totalMeters - occupiedMeters)
        const requestedMeters = parseInt(product.meters) || 0

        if (availableMeters < requestedMeters) {
          conflicts.push({
            type: 'PRODUTO',
            id: product.productId,
            name: productInfo.name,
            code: productInfo.code,
            requested: requestedMeters,
            available: availableMeters,
            total: productInfo.totalMeters,
            occupied: occupiedMeters,
            reason: `Metros insuficientes. Disponível: ${availableMeters}m, Solicitado: ${requestedMeters}m`,
            conflictingBookings: overlappingBookings
              .filter(booking => 
                booking.items.some(item => item.productId === product.productId)
              )
              .map(booking => ({
                id: booking.id,
                eventTitle: booking.eventTitle,
                clientName: booking.client.name,
                startDate: booking.startDate,
                endDate: booking.endDate,
                status: booking.status
              }))
          })
          allAvailable = false
        }
      }
    }

    // Verificar disponibilidade de acessórios
    if (accessories && Array.isArray(accessories)) {
      for (const accessory of accessories) {
        if (!accessory.accessoryId || !accessory.qty) continue

        const accessoryInfo = await prisma.accessory.findUnique({
          where: { id: accessory.accessoryId, companyId }
        })

        if (!accessoryInfo) {
          conflicts.push({
            type: 'ACESSÓRIO',
            id: accessory.accessoryId,
            name: 'Acessório não encontrado',
            reason: 'Acessório não existe ou não pertence à empresa'
          })
          allAvailable = false
          continue
        }

        // Calcular quantidade ocupada no período
        const occupiedQty = overlappingBookings.reduce((total, booking) => {
          return total + booking.accessories
            .filter(acc => acc.accessoryId === accessory.accessoryId)
            .reduce((sum, acc) => sum + acc.qty, 0)
        }, 0)

        const availableQty = Math.max(0, accessoryInfo.totalQty - occupiedQty)
        const requestedQty = parseInt(accessory.qty) || 0

        if (availableQty < requestedQty) {
          conflicts.push({
            type: 'ACESSÓRIO',
            id: accessory.accessoryId,
            name: accessoryInfo.name,
            code: accessoryInfo.code,
            requested: requestedQty,
            available: availableQty,
            total: accessoryInfo.totalQty,
            occupied: occupiedQty,
            reason: `Quantidade insuficiente. Disponível: ${availableQty}, Solicitado: ${requestedQty}`,
            conflictingBookings: overlappingBookings
              .filter(booking => 
                booking.accessories.some(acc => acc.accessoryId === accessory.accessoryId)
              )
              .map(booking => ({
                id: booking.id,
                eventTitle: booking.eventTitle,
                clientName: booking.client.name,
                startDate: booking.startDate,
                endDate: booking.endDate,
                status: booking.status
              }))
          })
          allAvailable = false
        }
      }
    }

    // Verificar disponibilidade de equipamentos
    if (equipment && Array.isArray(equipment)) {
      for (const equip of equipment) {
        if (!equip.equipmentId || !equip.qty) continue

        const equipmentInfo = await prisma.equipment.findUnique({
          where: { id: equip.equipmentId, companyId }
        })

        if (!equipmentInfo) {
          conflicts.push({
            type: 'EQUIPAMENTO',
            id: equip.equipmentId,
            name: 'Equipamento não encontrado',
            reason: 'Equipamento não existe ou não pertence à empresa'
          })
          allAvailable = false
          continue
        }

        // Calcular quantidade ocupada no período
        const occupiedQty = overlappingBookings.reduce((total, booking) => {
          return total + booking.equipment
            .filter(eq => eq.equipmentId === equip.equipmentId)
            .reduce((sum, eq) => sum + eq.qty, 0)
        }, 0)

        const availableQty = Math.max(0, equipmentInfo.totalQty - occupiedQty)
        const requestedQty = parseInt(equip.qty) || 0

        if (availableQty < requestedQty) {
          conflicts.push({
            type: 'EQUIPAMENTO',
            id: equip.equipmentId,
            name: equipmentInfo.name,
            code: equipmentInfo.code,
            requested: requestedQty,
            available: availableQty,
            total: equipmentInfo.totalQty,
            occupied: occupiedQty,
            reason: `Quantidade insuficiente. Disponível: ${availableQty}, Solicitado: ${requestedQty}`,
            conflictingBookings: overlappingBookings
              .filter(booking => 
                booking.equipment.some(eq => eq.equipmentId === equip.equipmentId)
              )
              .map(booking => ({
                id: booking.id,
                eventTitle: booking.eventTitle,
                clientName: booking.client.name,
                startDate: booking.startDate,
                endDate: booking.endDate,
                status: booking.status
              }))
          })
          allAvailable = false
        }
      }
    }

    // Resumo da verificação
    const totalItems = (products?.length || 0) + (accessories?.length || 0) + (equipment?.length || 0)
    const summary = {
      totalItems,
      availableItems: allAvailable ? totalItems : 0,
      unavailableItems: conflicts.length,
      generalStatus: allAvailable ? 'TOTALMENTE_DISPONIVEL' : 'PARCIALMENTE_DISPONIVEL'
    }

    return NextResponse.json({
      success: true,
      available: allAvailable,
      conflicts,
      summary,
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      message: allAvailable 
        ? 'Todos os itens estão disponíveis para o período solicitado'
        : 'Alguns itens não estão disponíveis para o período solicitado',
      recommendation: allAvailable 
        ? 'Pode prosseguir com a criação da locação'
        : 'Verifique a disponibilidade dos itens indisponíveis antes de prosseguir'
    })

  } catch (error) {
    console.error('Erro ao verificar disponibilidade avançada:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
