#!/usr/bin/env node

/**
 * Script para Adicionar Campos de Estoque Ocupado
 * 
 * Este script adiciona os campos occupiedMeters, occupiedQty aos modelos
 * Product, Accessory e Equipment para controle de estoque.
 * 
 * Uso: node scripts/add-inventory-fields.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addInventoryFields() {
  try {
    console.log('🚀 Iniciando adição de campos de estoque...')
    
    // Adicionar campo occupiedMeters aos produtos
    console.log('\n📦 Atualizando produtos...')
    await prisma.$executeRaw`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS "occupiedMeters" INTEGER DEFAULT 0
    `
    console.log('  ✅ Campo occupiedMeters adicionado aos produtos')
    
    // Adicionar campo occupiedQty aos acessórios
    console.log('\n⚙️ Atualizando acessórios...')
    await prisma.$executeRaw`
      ALTER TABLE accessories 
      ADD COLUMN IF NOT EXISTS "occupiedQty" INTEGER DEFAULT 0
    `
    console.log('  ✅ Campo occupiedQty adicionado aos acessórios')
    
    // Adicionar campo occupiedQty aos equipamentos
    console.log('\n🔧 Atualizando equipamentos...')
    await prisma.$executeRaw`
      ALTER TABLE equipment 
      ADD COLUMN IF NOT EXISTS "occupiedQty" INTEGER DEFAULT 0
    `
    console.log('  ✅ Campo occupiedQty adicionado aos equipamentos')
    
    // Verificar se os campos foram adicionados
    console.log('\n🔍 Verificando campos adicionados...')
    
    const productColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'occupiedMeters'
    `
    
    const accessoryColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'accessories' 
      AND column_name = 'occupiedQty'
    `
    
    const equipmentColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'equipment' 
      AND column_name = 'occupiedQty'
    `
    
    console.log(`  📦 Produtos: ${productColumns.length > 0 ? '✅' : '❌'} occupiedMeters`)
    console.log(`  ⚙️ Acessórios: ${accessoryColumns.length > 0 ? '✅' : '❌'} occupiedQty`)
    console.log(`  🔧 Equipamentos: ${equipmentColumns.length > 0 ? '✅' : '❌'} occupiedQty`)
    
    // Inicializar campos com valores padrão
    console.log('\n🔄 Inicializando campos com valores padrão...')
    
    await prisma.$executeRaw`
      UPDATE products 
      SET "occupiedMeters" = 0 
      WHERE "occupiedMeters" IS NULL
    `
    
    await prisma.$executeRaw`
      UPDATE accessories 
      SET "occupiedQty" = 0 
      WHERE "occupiedQty" IS NULL
    `
    
    await prisma.$executeRaw`
      UPDATE equipment 
      SET "occupiedQty" = 0 
      WHERE "occupiedQty" IS NULL
    `
    
    console.log('  ✅ Campos inicializados com valores padrão')
    
    // Contar registros atualizados
    const productCount = await prisma.product.count()
    const accessoryCount = await prisma.accessory.count()
    const equipmentCount = await prisma.equipment.count()
    
    console.log('\n📊 Resumo da operação:')
    console.log(`  📦 Produtos: ${productCount} registros`)
    console.log(`  ⚙️ Acessórios: ${accessoryCount} registros`)
    console.log(`  🔧 Equipamentos: ${equipmentCount} registros`)
    console.log('  ✅ Todos os campos de estoque foram adicionados com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao adicionar campos de estoque:', error)
    throw error
  }
}

async function main() {
  try {
    await addInventoryFields()
    console.log('\n🎉 Script executado com sucesso!')
    console.log('\n📝 Próximos passos:')
    console.log('  1. Execute: npx prisma generate')
    console.log('  2. Execute: npx prisma db push')
    console.log('  3. Reinicie o servidor da aplicação')
    
  } catch (error) {
    console.error('❌ Falha na execução do script:', error)
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
  addInventoryFields,
  main
}
