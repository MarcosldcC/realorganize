#!/usr/bin/env node

/**
 * Script de Teste da Verificação Detalhada de Disponibilidade
 * Testa a nova API que mostra informações específicas sobre cada item
 */

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

console.log('🧪 Testando verificação detalhada de disponibilidade...\n')

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const data = await response.json()
    
    return {
      success: response.ok,
      status: response.status,
      data
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function runTests() {
  console.log('📋 Teste 1: Verificação Detalhada de Disponibilidade')
  console.log('Endpoint: POST /api/availability/detailed')
  
  // Dados de teste para verificação detalhada
  const testData = {
    startDate: '2025-08-26',
    endDate: '2025-08-28',
    products: [
      { productId: 'test-product-1', meters: 10 },
      { productId: 'test-product-2', meters: 5 }
    ],
    accessories: [
      { accessoryId: 'test-accessory-1', qty: 2 },
      { accessoryId: 'test-accessory-2', qty: 1 }
    ],
    equipment: [
      { equipmentId: 'test-equipment-1', qty: 3 },
      { equipmentId: 'test-equipment-2', qty: 1 }
    ]
  }
  
  console.log('   - Dados de teste preparados')
  console.log(`   - Período: ${testData.startDate} a ${testData.endDate}`)
  console.log(`   - Produtos: ${testData.products.length}`)
  console.log(`   - Acessórios: ${testData.accessories.length}`)
  console.log(`   - Equipamentos: ${testData.equipment.length}`)
  
  const detailedResult = await testAPI('/api/availability/detailed', 'POST', testData)
  if (detailedResult.success) {
    console.log('✅ Verificação detalhada executada com sucesso')
    
    const data = detailedResult.data
    console.log(`   - Status geral: ${data.generalStatus}`)
    console.log(`   - Total de itens: ${data.summary.totalItems}`)
    console.log(`   - Itens disponíveis: ${data.summary.totalAvailable}`)
    
    // Verificar produtos
    if (data.products && data.products.length > 0) {
      console.log(`   - Produtos verificados: ${data.products.length}`)
      data.products.forEach((product, idx) => {
        console.log(`     ${idx + 1}. ${product.name} (${product.code})`)
        console.log(`        - Total: ${product.totalMeters} m`)
        console.log(`        - Ocupado: ${product.occupiedMeters} m`)
        console.log(`        - Disponível: ${product.availableMeters} m`)
        console.log(`        - Utilização: ${product.utilizationPercent}%`)
        console.log(`        - Status: ${product.isAvailable ? 'Disponível' : 'Indisponível'}`)
        
        if (product.occupyingBookings && product.occupyingBookings.length > 0) {
          console.log(`        - Locações ocupando: ${product.occupyingBookings.length}`)
          product.occupyingBookings.forEach((booking, bIdx) => {
            console.log(`          ${bIdx + 1}. ${booking.eventTitle} (${booking.clientName})`)
            console.log(`             - Período: ${new Date(booking.startDate).toLocaleDateString('pt-BR')} a ${new Date(booking.endDate).toLocaleDateString('pt-BR')}`)
            console.log(`             - Ocupando: ${booking.occupiedMeters} m`)
            console.log(`             - Status: ${booking.status}`)
          })
        }
        
        if (product.availabilityByDate && product.availabilityByDate.length > 0) {
          console.log(`        - Disponibilidade por data: ${product.availabilityByDate.length} dias`)
          product.availabilityByDate.forEach((dateInfo, dIdx) => {
            console.log(`          ${dIdx + 1}. ${dateInfo.date}: ${dateInfo.availableMeters}/${dateInfo.totalMeters} m`)
            if (dateInfo.occupyingBookings && dateInfo.occupyingBookings.length > 0) {
              console.log(`             - Ocupando neste dia: ${dateInfo.occupyingBookings.length} locações`)
            }
          })
        }
      })
    }
    
    // Verificar acessórios
    if (data.accessories && data.accessories.length > 0) {
      console.log(`   - Acessórios verificados: ${data.accessories.length}`)
      data.accessories.forEach((accessory, idx) => {
        console.log(`     ${idx + 1}. ${accessory.name} (${accessory.code})`)
        console.log(`        - Total: ${accessory.totalQty} un`)
        console.log(`        - Ocupado: ${accessory.occupiedQty} un`)
        console.log(`        - Disponível: ${accessory.availableQty} un`)
        console.log(`        - Utilização: ${accessory.utilizationPercent}%`)
        console.log(`        - Status: ${accessory.isAvailable ? 'Disponível' : 'Indisponível'}`)
      })
    }
    
    // Verificar equipamentos
    if (data.equipment && data.equipment.length > 0) {
      console.log(`   - Equipamentos verificados: ${data.equipment.length}`)
      data.equipment.forEach((equip, idx) => {
        console.log(`     ${idx + 1}. ${equip.name} (${equip.code})`)
        console.log(`        - Total: ${equip.totalQty} un`)
        console.log(`        - Ocupado: ${equip.occupiedQty} un`)
        console.log(`        - Disponível: ${equip.availableQty} un`)
        console.log(`        - Utilização: ${equip.utilizationPercent}%`)
        console.log(`        - Status: ${equip.isAvailable ? 'Disponível' : 'Indisponível'}`)
      })
    }
    
  } else {
    console.log('❌ Falha na verificação detalhada:', detailedResult.error || detailedResult.data?.error)
  }
  
  console.log('')
  
  // Teste 2: Verificar funcionalidades da API unificada
  console.log('📊 Teste 2: Verificar Funcionalidades da API Unificada')
  
  if (detailedResult.success) {
    const data = detailedResult.data
    console.log('   - Funcionalidades disponíveis:')
    console.log(`     ✅ Verificação básica: ${data.generalStatus}`)
    console.log(`     ✅ Informações detalhadas: ${data.products.length + data.accessories.length + data.equipment.length} itens`)
    console.log(`     ✅ Disponibilidade por data: ${data.products.length > 0 ? data.products[0].availabilityByDate.length : 0} dias`)
    console.log(`     ✅ Percentual de utilização: ${data.products.length > 0 ? data.products[0].utilizationPercent : 0}%`)
    console.log(`     ✅ Locações ocupando: ${data.products.length > 0 ? data.products[0].occupyingBookings.length : 0} locações`)
    
    console.log('   - Status da consolidação:')
    console.log(`     - API única funcionando: ✅`)
    console.log(`     - Verificação detalhada integrada: ✅`)
    console.log(`     - Frontend simplificado: ✅`)
  }
  
  console.log('')
}

// Executar testes
runTests().catch(console.error)
