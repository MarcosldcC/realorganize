import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('📊 Carregando KPIs do dashboard...')
    
    // Buscar dados do banco
    const totalBookings = await prisma.booking.count()
    console.log(`  📅 Total de locações: ${totalBookings}`)
    
    const futureBookings = await prisma.booking.count({
      where: {
        startDate: {
          gte: new Date()
        }
      }
    })
    console.log(`  🔮 Locações futuras: ${futureBookings}`)
    
    const confirmedBookings = await prisma.booking.count({
      where: {
        status: 'CONFIRMED'
      }
    })
    console.log(`  ✅ Locações confirmadas: ${confirmedBookings}`)
    
    const holdBookings = await prisma.booking.count({
      where: {
        status: 'HOLD'
      }
    })
    console.log(`  ⏸️ Locações em espera: ${holdBookings}`)

    // Calcular receitas
    const bookings = await prisma.booking.findMany({
      select: {
        totalValue: true,
        status: true,
        paymentStatus: true
      }
    })

    const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.totalValue || 0), 0)
    const receivedAmount = bookings
      .filter(booking => booking.paymentStatus === 'PAID')
      .reduce((sum, booking) => sum + Number(booking.totalValue || 0), 0)
    const pendingAmount = bookings
      .filter(booking => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(booking.paymentStatus))
      .reduce((sum, booking) => sum + Number(booking.totalValue || 0), 0)

    // Buscar estatísticas de produtos
    const totalProducts = await prisma.product.count()
    const totalProductMeters = await prisma.product.aggregate({
      _sum: { totalMeters: true }
    })
    const totalProductMetersValue = totalProductMeters._sum.totalMeters || 0

    // Buscar estatísticas de clientes
    const totalClients = await prisma.client.count()

    // Buscar estatísticas de equipamentos
    const totalEquipment = await prisma.equipment.count()
    const totalEquipmentQty = await prisma.equipment.aggregate({
      _sum: { totalQty: true }
    })
    const totalEquipmentQtyValue = totalEquipmentQty._sum.totalQty || 0

    const kpis = {
      totalBookings,
      futureBookings,
      confirmedBookings,
      holdBookings,
      totalRevenue,
      receivedAmount,
      pendingAmount,
      overdueAmount: 0,
      // Novos KPIs
      totalProducts,
      totalProductMeters: totalProductMetersValue,
      totalClients,
      totalEquipment,
      totalEquipmentQty: totalEquipmentQtyValue
    }

    console.log('✅ KPIs carregados com sucesso:', kpis)
    
    return NextResponse.json(kpis)
  } catch (error) {
    console.error('❌ Erro ao buscar KPIs:', error)
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
