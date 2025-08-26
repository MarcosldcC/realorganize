#!/usr/bin/env node

/**
 * Script de Teste do Sistema de Estoque
 * 
 * Este script verifica o status atual do estoque e das locações
 * para identificar problemas no sistema de controle.
 * 
 * Uso: node scripts/test-inventory.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testInventorySystem() {
  try {
    console.log('🔍 Testando sistema de estoque...')
    
    // 1. Verificar locações existentes
    console.log('\n📊 Verificando locações existentes...')
    const allBookings = await prisma.booking.findMany({
      include: {
        items: true,
        accessories: true,
        equipment: true
      }
    })
    
    console.log(`  Total de locações: ${allBookings.length}`)
    
    allBookings.forEach(booking => {
      const startDate = new Date(booking.startDate)
      const endDate = new Date(booking.endDate)
      const now = new Date()
      const isExpired = endDate < now
      const isActive = ['CONFIRMED', 'PENDING', 'IN_PROGRESS'].includes(booking.status)
      
      console.log(`  📅 ${booking.eventTitle}:`)
      console.log(`    Status: ${booking.status} ${isActive ? '(ATIVO)' : '(INATIVO)'}`)
      console.log(`    Período: ${startDate.toLocaleDateString('pt-BR')} → ${endDate.toLocaleDateString('pt-BR')}`)
      console.log(`    Expirada: ${isExpired ? '✅ SIM' : '❌ NÃO'}`)
      console.log(`    Produtos: ${booking.items.length}, Acessórios: ${booking.accessories.length}, Equipamentos: ${booking.equipment.length}`)
      
      if (isExpired && isActive) {
        console.log(`    ⚠️  PROBLEMA: Locação expirada mas ainda ativa!`)
      }
    })
    
    // 2. Verificar status do estoque
    console.log('\n📦 Verificando status do estoque...')
    
    const products = await prisma.product.findMany()
    const accessories = await prisma.accessory.findMany()
    const equipment = await prisma.equipment.findMany()
    
    console.log('  📦 PRODUTOS:')
    products.forEach(p => {
      const available = p.totalMeters - (p.occupiedMeters || 0)
      const utilization = p.totalMeters > 0 ? ((p.occupiedMeters || 0) / p.totalMeters * 100).toFixed(1) : 0
      console.log(`    ${p.name}: ${available}/${p.totalMeters}m² disponíveis (${utilization}% ocupado)`)
    })
    
    console.log('  ⚙️ ACESSÓRIOS:')
    accessories.forEach(a => {
      const available = a.totalQty - (a.occupiedQty || 0)
      const utilization = a.totalQty > 0 ? ((a.occupiedQty || 0) / a.totalQty * 100).toFixed(1) : 0
      console.log(`    ${a.name}: ${available}/${a.totalQty} unidades disponíveis (${utilization}% ocupado)`)
    })
    
    console.log('  🔧 EQUIPAMENTOS:')
    equipment.forEach(e => {
      const available = e.totalQty - (e.occupiedQty || 0)
      const utilization = e.totalQty > 0 ? ((e.occupiedQty || 0) / e.totalQty * 100).toFixed(1) : 0
      console.log(`    ${e.name}: ${available}/${e.totalQty} unidades disponíveis (${utilization}% ocupado)`)
    })
    
    // 3. Verificar locações expiradas que ainda estão ocupando estoque
    console.log('\n⚠️  Verificando locações expiradas que ainda ocupam estoque...')
    
    const now = new Date()
    const expiredActiveBookings = allBookings.filter(booking => {
      const endDate = new Date(booking.endDate)
      const isExpired = endDate < now
      const isActive = ['CONFIRMED', 'PENDING', 'IN_PROGRESS'].includes(booking.status)
      return isExpired && isActive
    })
    
    if (expiredActiveBookings.length === 0) {
      console.log('  ✅ Nenhuma locação expirada encontrada')
    } else {
      console.log(`  ❌ Encontradas ${expiredActiveBookings.length} locações expiradas que ainda ocupam estoque:`)
      
      expiredActiveBookings.forEach(booking => {
        console.log(`    📅 ${booking.eventTitle} (ID: ${booking.id})`)
        console.log(`      Expirou em: ${new Date(booking.endDate).toLocaleDateString('pt-BR')}`)
        console.log(`      Status atual: ${booking.status}`)
        
        if (booking.items.length > 0) {
          console.log(`      Produtos ocupando estoque: ${booking.items.length}`)
        }
        if (booking.accessories.length > 0) {
          console.log(`      Acessórios ocupando estoque: ${booking.accessories.length}`)
        }
        if (booking.equipment.length > 0) {
          console.log(`      Equipamentos ocupando estoque: ${booking.equipment.length}`)
        }
      })
    }
    
    // 4. Recomendações
    console.log('\n💡 RECOMENDAÇÕES:')
    
    if (expiredActiveBookings.length > 0) {
      console.log('  1. Execute a manutenção automática do estoque')
      console.log('  2. Verifique se o script de manutenção está funcionando')
      console.log('  3. Considere executar a manutenção manualmente')
    } else {
      console.log('  1. Sistema de estoque parece estar funcionando corretamente')
      console.log('  2. Continue monitorando as locações')
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar sistema:', error)
  }
}

async function main() {
  try {
    await testInventorySystem()
  } catch (error) {
    console.error('❌ Falha no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  testInventorySystem
}
