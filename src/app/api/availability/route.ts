import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Buscar estoque atual (produtos, acessórios, equipamentos)
    const [products, accessories, equipment] = await Promise.all([
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          totalMeters: true,
          pricePerMeter: true
        }
      }),
      prisma.accessory.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          totalQty: true,
          pricePerUnit: true
        }
      }),
      prisma.equipment.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          totalQty: true,
          pricePerUnit: true
        }
      })
    ])

    // Buscar locações ativas (que podem estar ocupando itens)
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'PENDING'] }
      },
      include: {
        items: { include: { product: true } },
        accessories: { include: { accessory: true } },
        equipment: { include: { equipment: true } },
        client: { select: { name: true } }
      }
    })

    // Calcular disponibilidade atual
    const currentAvailability = {
      products: products.map(product => {
        const occupiedMeters = activeBookings.reduce((total, booking) => {
          return total + booking.items
            .filter(item => item.productId === product.id)
            .reduce((sum, item) => sum + item.meters, 0)
        }, 0)
        
        return {
          ...product,
          occupiedMeters,
          availableMeters: Math.max(0, product.totalMeters - occupiedMeters),
          utilizationPercent: product.totalMeters > 0 
            ? Math.round((occupiedMeters / product.totalMeters) * 100) 
            : 0,
          status: (product.totalMeters - occupiedMeters) > 0 ? 'DISPONÍVEL' : 'INDISPONÍVEL'
        }
      }),
      accessories: accessories.map(accessory => {
        const occupiedQty = activeBookings.reduce((total, booking) => {
          return total + booking.accessories
            .filter(acc => acc.accessoryId === accessory.id)
            .reduce((sum, acc) => sum + acc.quantity, 0)
        }, 0)
        
        return {
          ...accessory,
          occupiedQty,
          availableQty: Math.max(0, accessory.totalQty - occupiedQty),
          utilizationPercent: accessory.totalQty > 0 
            ? Math.round((occupiedQty / accessory.totalQty) * 100) 
            : 0,
          status: (accessory.totalQty - occupiedQty) > 0 ? 'DISPONÍVEL' : 'INDISPONÍVEL'
        }
      }),
      equipment: equipment.map(equip => {
        const occupiedQty = activeBookings.reduce((total, booking) => {
          return total + booking.equipment
            .filter(eq => eq.equipmentId === equip.id)
            .reduce((sum, eq) => sum + eq.quantity, 0)
        }, 0)
        
        return {
          ...equip,
          occupiedQty,
          availableQty: Math.max(0, equip.totalQty - occupiedQty),
          utilizationPercent: equip.totalQty > 0 
            ? Math.round((occupiedQty / equip.totalQty) * 100) 
            : 0,
          status: (equip.totalQty - occupiedQty) > 0 ? 'DISPONÍVEL' : 'INDISPONÍVEL'
        }
      })
    }

    // Resumo geral
    const summary = {
      totalProducts: products.length,
      totalAccessories: accessories.length,
      totalEquipment: equipment.length,
      totalProductMeters: products.reduce((sum, p) => sum + p.totalMeters, 0),
      totalAccessoryQty: accessories.reduce((sum, a) => sum + a.totalQty, 0),
      totalEquipmentQty: equipment.reduce((sum, e) => sum + e.totalQty, 0),
      occupiedProductMeters: currentAvailability.products.reduce((sum, p) => sum + p.occupiedMeters, 0),
      occupiedAccessoryQty: currentAvailability.accessories.reduce((sum, a) => sum + a.occupiedQty, 0),
      occupiedEquipmentQty: currentAvailability.equipment.reduce((sum, e) => sum + e.occupiedQty, 0),
      availableProductMeters: currentAvailability.products.reduce((sum, p) => sum + p.availableMeters, 0),
      availableAccessoryQty: currentAvailability.accessories.reduce((sum, a) => sum + a.availableQty, 0),
      availableEquipmentQty: currentAvailability.equipment.reduce((sum, e) => sum + e.availableQty, 0),
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      currentAvailability,
      summary,
      activeBookings: activeBookings.length
    })

  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startDate, endDate, items } = body

    if (!startDate || !endDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Datas de início/fim e itens são obrigatórios' },
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

    // Buscar locações que se sobrepõem ao período solicitado
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        AND: [
          { startDate: { lte: end } },
          { endDate: { gte: start } },
          { status: { in: ['CONFIRMED', 'IN_PROGRESS', 'PENDING'] } }
        ]
      },
      include: {
        items: { include: { product: true } },
        accessories: { include: { accessory: true } },
        equipment: { include: { equipment: true } },
        client: { select: { name: true } }
      }
    })

    // Verificar disponibilidade para cada item solicitado
    const availabilityResults = []
    let allAvailable = true

    for (const requestedItem of items) {
      const { type, id, quantity, unit } = requestedItem
      
      let itemInfo, occupiedQuantity, totalQuantity, availableQuantity
      let occupyingBookings = []

      switch (type) {
        case 'PRODUTO':
          itemInfo = await prisma.product.findUnique({ where: { id } })
          if (itemInfo) {
            totalQuantity = itemInfo.totalMeters
            occupiedQuantity = overlappingBookings.reduce((total, booking) => {
              return total + booking.items
                .filter(item => item.productId === id)
                .reduce((sum, item) => sum + item.meters, 0)
            }, 0)
            availableQuantity = Math.max(0, totalQuantity - occupiedQuantity)
            
            // Buscar locações que estão ocupando este produto
            overlappingBookings.forEach(booking => {
              booking.items.forEach(item => {
                if (item.productId === id && item.meters > 0) {
                  occupyingBookings.push({
                    bookingId: booking.id,
                    eventTitle: booking.eventTitle,
                    clientName: booking.client.name,
                    startDate: booking.startDate,
                    endDate: booking.endDate,
                    occupiedQuantity: item.meters,
                    status: booking.status
                  })
                }
              })
            })
          }
          break

        case 'ACESSÓRIO':
          itemInfo = await prisma.accessory.findUnique({ where: { id } })
          if (itemInfo) {
            totalQuantity = itemInfo.totalQty
            occupiedQuantity = overlappingBookings.reduce((total, booking) => {
              return total + booking.accessories
                .filter(acc => acc.accessoryId === id)
                .reduce((sum, acc) => sum + acc.quantity, 0)
            }, 0)
            availableQuantity = Math.max(0, totalQuantity - occupiedQuantity)
            
            // Buscar locações que estão ocupando este acessório
            overlappingBookings.forEach(booking => {
              booking.accessories.forEach(acc => {
                if (acc.accessoryId === id && acc.quantity > 0) {
                  occupyingBookings.push({
                    bookingId: booking.id,
                    eventTitle: booking.eventTitle,
                    clientName: booking.client.name,
                    startDate: booking.startDate,
                    endDate: booking.endDate,
                    occupiedQuantity: acc.quantity,
                    status: booking.status
                  })
                }
              })
            })
          }
          break

        case 'EQUIPAMENTO':
          itemInfo = await prisma.equipment.findUnique({ where: { id } })
          if (itemInfo) {
            totalQuantity = itemInfo.totalQty
            occupiedQuantity = overlappingBookings.reduce((total, booking) => {
              return total + booking.equipment
                .filter(eq => eq.equipmentId === id)
                .reduce((sum, eq) => sum + eq.quantity, 0)
            }, 0)
            availableQuantity = Math.max(0, totalQuantity - occupiedQuantity)
            
            // Buscar locações que estão ocupando este equipamento
            overlappingBookings.forEach(booking => {
              booking.equipment.forEach(eq => {
                if (eq.equipmentId === id && eq.quantity > 0) {
                  occupyingBookings.push({
                    bookingId: booking.id,
                    eventTitle: booking.eventTitle,
                    clientName: booking.client.name,
                    startDate: booking.startDate,
                    endDate: booking.endDate,
                    occupiedQuantity: eq.quantity,
                    status: booking.status
                  })
                }
              })
            })
          }
          break
      }

      if (itemInfo) {
        const isAvailable = availableQuantity >= quantity
        if (!isAvailable) allAvailable = false

        availabilityResults.push({
          id,
          name: itemInfo.name,
          code: itemInfo.code,
          type,
          requestedQuantity: quantity,
          availableQuantity,
          totalQuantity,
          occupiedQuantity,
          unit,
          status: isAvailable ? 'DISPONÍVEL' : 'INDISPONÍVEL',
          reason: isAvailable ? undefined : `Quantidade insuficiente. Disponível: ${availableQuantity} ${unit}`,
          occupyingBookings
        })
      }
    }

    // Resumo da verificação
    const summary = {
      totalItems: items.length,
      availableItems: availabilityResults.filter(item => item.status === 'DISPONÍVEL').length,
      unavailableItems: availabilityResults.filter(item => item.status === 'INDISPONÍVEL').length,
      generalStatus: allAvailable ? 'TOTALMENTE_DISPONIVEL' : 'PARCIALMENTE_DISPONIVEL'
    }

    return NextResponse.json({
      success: true,
      available: allAvailable,
      results: availabilityResults,
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
    console.error('Erro ao verificar disponibilidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
