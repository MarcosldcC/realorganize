#!/usr/bin/env node

/**
 * Script para Corrigir Estoque de Locações
 * 
 * Este script corrige o estoque de locações que estão com status incorreto
 * e não deveriam estar ocupando estoque.
 * 
 * Uso: node scripts/fix-inventory.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixInventoryStatus() {
  try {
    console.log('🔧 Corrigindo status do estoque...')
    
    // Buscar todas as locações
    const allBookings = await prisma.booking.findMany({
      include: {
        items: true,
        accessories: true,
        equipment: true
      }
    })

    let fixedCount = 0
    const activeStatuses = ['CONFIRMED', 'PENDING', 'IN_PROGRESS']

    for (const booking of allBookings) {
      const shouldOccupyStock = activeStatuses.includes(booking.status)
      let needsFix = false

      console.log(`\n📅 Verificando locação: ${booking.eventTitle} (Status: ${booking.status})`)

      // Verificar produtos
      for (const item of booking.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })
        
        if (product) {
          const currentOccupied = product.occupiedMeters || 0
          const expectedOccupied = shouldOccupyStock ? item.meters : 0
          
          if (currentOccupied !== expectedOccupied) {
            needsFix = true
            console.log(`  📦 Produto ${product.name}: ocupado=${currentOccupied}, esperado=${expectedOccupied}`)
          }
        }
      }

      // Verificar acessórios
      for (const accessory of booking.accessories) {
        const acc = await prisma.accessory.findUnique({
          where: { id: accessory.accessoryId }
        })
        
        if (acc) {
          const currentOccupied = acc.occupiedQty || 0
          const expectedOccupied = shouldOccupyStock ? accessory.qty : 0
          
          if (currentOccupied !== expectedOccupied) {
            needsFix = true
            console.log(`  ⚙️ Acessório ${acc.name}: ocupado=${currentOccupied}, esperado=${expectedOccupied}`)
          }
        }
      }

      // Verificar equipamentos
      for (const equip of booking.equipment) {
        const eq = await prisma.equipment.findUnique({
          where: { id: equip.equipmentId }
        })
        
        if (eq) {
          const currentOccupied = eq.occupiedQty || 0
          const expectedOccupied = shouldOccupyStock ? equip.qty : 0
          
          if (currentOccupied !== expectedOccupied) {
            needsFix = true
            console.log(`  🔧 Equipamento ${eq.name}: ocupado=${currentOccupied}, esperado=${expectedOccupied}`)
          }
        }
      }

      if (needsFix) {
        console.log(`  🔄 Corrigindo locação ${booking.id}`)
        
        // Restaurar estoque atual
        await restoreInventoryOnBookingDelete(booking.id)
        
        // Aplicar estoque correto se necessário
        if (shouldOccupyStock) {
          await updateInventoryOnBookingCreate(booking.id)
        }
        
        fixedCount++
        console.log(`  ✅ Locação ${booking.id} corrigida`)
      } else {
        console.log(`  ✅ Locação ${booking.id} está correta`)
      }
    }

    console.log(`\n🎉 Correção concluída: ${fixedCount} locações corrigidas`)
    return fixedCount
  } catch (error) {
    console.error('❌ Erro ao corrigir estoque:', error)
    throw error
  }
}

async function restoreInventoryOnBookingDelete(bookingId) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: true,
        accessories: true,
        equipment: true
      }
    })

    if (!booking) return

    // Restaurar estoque de produtos
    for (const item of booking.items) {
      if (item.meters > 0) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            occupiedMeters: {
              decrement: item.meters
            }
          }
        })
      }
    }

    // Restaurar estoque de acessórios
    for (const accessory of booking.accessories) {
      if (accessory.qty > 0) {
        await prisma.accessory.update({
          where: { id: accessory.accessoryId },
          data: {
            occupiedQty: {
              decrement: accessory.qty
            }
          }
        })
      }
    }

    // Restaurar estoque de equipamentos
    for (const equipment of booking.equipment) {
      if (equipment.qty > 0) {
        await prisma.equipment.update({
          where: { id: equipment.equipmentId },
          data: {
            occupiedQty: {
              decrement: equipment.qty
            }
          }
        })
      }
    }

    console.log(`    📦 Estoque restaurado para locação ${bookingId}`)
  } catch (error) {
    console.error(`    ❌ Erro ao restaurar estoque:`, error)
  }
}

async function updateInventoryOnBookingCreate(bookingId) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: true,
        accessories: true,
        equipment: true
      }
    })

    if (!booking) return

    // Atualizar estoque de produtos
    for (const item of booking.items) {
      if (item.meters > 0) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            occupiedMeters: {
              increment: item.meters
            }
          }
        })
      }
    }

    // Atualizar estoque de acessórios
    for (const accessory of booking.accessories) {
      if (accessory.qty > 0) {
        await prisma.accessory.update({
          where: { id: accessory.accessoryId },
          data: {
            occupiedQty: {
              increment: accessory.qty
            }
          }
        })
      }
    }

    // Atualizar estoque de equipamentos
    for (const equipment of booking.equipment) {
      if (equipment.qty > 0) {
        await prisma.equipment.update({
          where: { id: equipment.equipmentId },
          data: {
            occupiedQty: {
              increment: equipment.qty
            }
          }
        })
      }
    }

    console.log(`    📦 Estoque atualizado para locação ${bookingId}`)
  } catch (error) {
    console.error(`    ❌ Erro ao atualizar estoque:`, error)
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando correção do estoque...')
    const fixedCount = await fixInventoryStatus()
    
    console.log('\n📊 Resumo da correção:')
    console.log(`  ✅ Locações corrigidas: ${fixedCount}`)
    
    if (fixedCount > 0) {
      console.log('\n💡 Recomendações:')
      console.log('  1. Verifique o status do estoque novamente')
      console.log('  2. Teste a criação de uma nova locação')
      console.log('  3. Monitore as próximas locações')
    }
    
  } catch (error) {
    console.error('❌ Falha na correção:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  fixInventoryStatus
}
