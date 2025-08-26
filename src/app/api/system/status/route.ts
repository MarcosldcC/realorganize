import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('📊 Obtendo status do sistema...')
    
    // Buscar todos os produtos, acessórios e equipamentos
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        totalMeters: true,
        occupiedMeters: true
      }
    })

    const accessories = await prisma.accessory.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        totalQty: true,
        occupiedQty: true
      }
    })

    const equipment = await prisma.equipment.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        totalQty: true,
        occupiedQty: true
      }
    })

    // Buscar locações ativas
    const activeBookings = await prisma.booking.count({
      where: {
        status: {
          in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS']
        }
      }
    })

    // Calcular totais
    const totalProductMeters = products.reduce((sum, p) => sum + p.totalMeters, 0)
    const totalAccessoryQty = accessories.reduce((sum, a) => sum + a.totalQty, 0)
    const totalEquipmentQty = equipment.reduce((sum, e) => sum + e.totalQty, 0)

    const totalOccupiedProductMeters = products.reduce((sum, p) => sum + (p.occupiedMeters || 0), 0)
    const totalOccupiedAccessoryQty = accessories.reduce((sum, a) => sum + (a.occupiedQty || 0), 0)
    const totalOccupiedEquipmentQty = equipment.reduce((sum, e) => sum + (e.occupiedQty || 0), 0)

    const availableProductMeters = Math.max(0, totalProductMeters - totalOccupiedProductMeters)
    const availableAccessoryQty = Math.max(0, totalAccessoryQty - totalOccupiedAccessoryQty)
    const availableEquipmentQty = Math.max(0, totalEquipmentQty - totalOccupiedEquipmentQty)

    // Calcular percentual de utilização
    const productUtilizationPercent = totalProductMeters > 0 ? 
      Math.round((totalOccupiedProductMeters / totalProductMeters) * 100) : 0
    
    const accessoryUtilizationPercent = totalAccessoryQty > 0 ? 
      Math.round((totalOccupiedAccessoryQty / totalAccessoryQty) * 100) : 0

    const equipmentUtilizationPercent = totalEquipmentQty > 0 ? 
      Math.round((totalOccupiedEquipmentQty / totalEquipmentQty) * 100) : 0

    // Preparar lista de produtos com status
    const productsWithStatus = products.map(product => {
      const occupiedMeters = product.occupiedMeters || 0
      const availableMeters = Math.max(0, product.totalMeters - occupiedMeters)
      const utilizationPercent = product.totalMeters > 0 ? 
        Math.round((occupiedMeters / product.totalMeters) * 100) : 0

      return {
        id: product.id,
        name: product.name,
        code: product.code,
        totalMeters: product.totalMeters,
        occupiedMeters,
        availableMeters,
        utilizationPercent,
        status: availableMeters > 0 ? 'DISPONÍVEL' : 'INDISPONÍVEL'
      }
    })

    // Preparar lista de acessórios com status
    const accessoriesWithStatus = accessories.map(accessory => {
      const occupiedQty = accessory.occupiedQty || 0
      const availableQty = Math.max(0, accessory.totalQty - occupiedQty)
      const utilizationPercent = accessory.totalQty > 0 ? 
        Math.round((occupiedQty / accessory.totalQty) * 100) : 0

      return {
        id: accessory.id,
        name: accessory.name,
        code: accessory.code,
        totalQty: accessory.totalQty,
        occupiedQty,
        availableQty,
        utilizationPercent,
        status: availableQty > 0 ? 'DISPONÍVEL' : 'INDISPONÍVEL'
      }
    })

    // Preparar lista de equipamentos com status
    const equipmentWithStatus = equipment.map(equip => {
      const occupiedQty = equip.occupiedQty || 0
      const availableQty = Math.max(0, equip.totalQty - occupiedQty)
      const utilizationPercent = equip.totalQty > 0 ? 
        Math.round((occupiedQty / equip.totalQty) * 100) : 0

      return {
        id: equip.id,
        name: equip.name,
        code: equip.code,
        totalQty: equip.totalQty,
        occupiedQty,
        availableQty,
        utilizationPercent,
        status: availableQty > 0 ? 'DISPONÍVEL' : 'INDISPONÍVEL'
      }
    })

    const systemStatus = {
      overview: {
        totalProducts: products.length,
        totalAccessories: accessories.length,
        totalEquipment: equipment.length,
        totalActiveBookings: activeBookings,
        totalProductMeters,
        totalAccessoryQty,
        totalEquipmentQty,
        totalOccupiedProductMeters,
        totalOccupiedAccessoryQty,
        totalOccupiedEquipmentQty,
        availableProductMeters,
        availableAccessoryQty,
        availableEquipmentQty,
        productUtilizationPercent,
        accessoryUtilizationPercent,
        equipmentUtilizationPercent
      },
      products: productsWithStatus,
      accessories: accessoriesWithStatus,
      equipment: equipmentWithStatus,
      lastUpdated: new Date().toISOString()
    }

    console.log('✅ Status do sistema obtido com sucesso')
    
    return NextResponse.json({
      success: true,
      systemStatus
    })

  } catch (error) {
    console.error('❌ Erro ao obter status do sistema:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
