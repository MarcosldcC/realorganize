#!/usr/bin/env node

/**
 * Script de Manutenção Automática do Estoque
 * 
 * Este script verifica locações expiradas e atualiza o estoque automaticamente.
 * Pode ser executado via cron job ou manualmente.
 * 
 * Uso:
 * - Manual: node scripts/inventory-maintenance.js
 * - Cron: 0 */6 * * * node /path/to/led-rental-app/scripts/inventory-maintenance.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkExpiredBookings() {
  try {
    console.log('🔍 Verificando locações expiradas...')
    
    const now = new Date()
    
    // Buscar locações expiradas (endDate < now) com status ativo
    const expiredBookings = await prisma.booking.findMany({
      where: {
        endDate: {
          lt: now
        },
        status: {
          in: ['CONFIRMED', 'PENDING', 'IN_PROGRESS']
        }
      },
      include: {
        items: true,
        accessories: true,
        equipment: true
      }
    })

    console.log(`📊 Encontradas ${expiredBookings.length} locações expiradas`)

    if (expiredBookings.length === 0) {
      console.log('✅ Nenhuma locação expirada encontrada')
      return 0
    }

    let processedCount = 0

    for (const booking of expiredBookings) {
      try {
        console.log(`\n🔄 Processando locação ${booking.id} (${booking.eventTitle})`)
        
        // Marcar como COMPLETED
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'COMPLETED' }
        })
        console.log(`  ✅ Status atualizado para COMPLETED`)

        // Restaurar estoque de produtos
        if (booking.items.length > 0) {
          for (const item of booking.items) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                occupiedMeters: {
                  decrement: item.meters
                }
              }
            })
            console.log(`  📦 Produto ${item.productId}: -${item.meters}m² restaurado`)
          }
        }

        // Restaurar estoque de acessórios
        if (booking.accessories.length > 0) {
          for (const accessory of booking.accessories) {
            await prisma.accessory.update({
              where: { id: accessory.accessoryId },
              data: {
                occupiedQty: {
                  decrement: accessory.qty
                }
              }
            })
            console.log(`  ⚙️ Acessório ${accessory.accessoryId}: -${accessory.qty} unidades restauradas`)
          }
        }

        // Restaurar estoque de equipamentos
        if (booking.equipment.length > 0) {
          for (const equip of booking.equipment) {
            await prisma.equipment.update({
              where: { id: equip.equipmentId },
              data: {
                occupiedQty: {
                  decrement: equip.qty
                }
              }
            })
            console.log(`  🔧 Equipamento ${equip.equipmentId}: -${equip.qty} unidades restauradas`)
          }
        }

        processedCount++
        console.log(`  🎯 Locação ${booking.id} processada com sucesso`)
        
      } catch (error) {
        console.error(`  ❌ Erro ao processar locação ${booking.id}:`, error.message)
      }
    }

    console.log(`\n📈 Resumo: ${processedCount}/${expiredBookings.length} locações processadas com sucesso`)
    return processedCount

  } catch (error) {
    console.error('❌ Erro ao verificar locações expiradas:', error)
    throw error
  }
}

async function generateInventoryReport() {
  try {
    console.log('\n📊 Gerando relatório de estoque...')
    
    const products = await prisma.product.findMany({
      select: {
        name: true,
        code: true,
        totalMeters: true,
        occupiedMeters: true
      }
    })

    const accessories = await prisma.accessory.findMany({
      select: {
        name: true,
        code: true,
        totalQty: true,
        occupiedQty: true
      }
    })

    const equipment = await prisma.equipment.findMany({
      select: {
        name: true,
        code: true,
        totalQty: true,
        occupiedQty: true
      }
    })

    console.log('\n📦 PRODUTOS:')
    products.forEach(p => {
      const available = p.totalMeters - p.occupiedMeters
      const utilization = ((p.occupiedMeters / p.totalMeters) * 100).toFixed(1)
      console.log(`  ${p.code} - ${p.name}: ${available}/${p.totalMeters}m² (${utilization}% ocupado)`)
    })

    console.log('\n⚙️ ACESSÓRIOS:')
    accessories.forEach(a => {
      const available = a.totalQty - a.occupiedQty
      const utilization = ((a.occupiedQty / a.totalQty) * 100).toFixed(1)
      console.log(`  ${a.code} - ${a.name}: ${available}/${a.totalQty} un (${utilization}% ocupado)`)
    })

    console.log('\n🔧 EQUIPAMENTOS:')
    equipment.forEach(e => {
      const available = e.totalQty - e.occupiedQty
      const utilization = ((e.occupiedQty / e.totalQty) * 100).toFixed(1)
      console.log(`  ${e.code} - ${e.name}: ${available}/${e.totalQty} un (${utilization}% ocupado)`)
    })

  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error)
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando manutenção automática do estoque...')
    console.log(`⏰ ${new Date().toLocaleString('pt-BR')}`)
    
    // Verificar locações expiradas
    const expiredCount = await checkExpiredBookings()
    
    // Gerar relatório de estoque
    await generateInventoryReport()
    
    console.log('\n✅ Manutenção concluída com sucesso!')
    console.log(`📊 ${expiredCount} locações expiradas processadas`)
    
  } catch (error) {
    console.error('❌ Erro na manutenção:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}

module.exports = {
  checkExpiredBookings,
  generateInventoryReport,
  main
}
