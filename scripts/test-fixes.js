#!/usr/bin/env node

/**
 * Script de Teste das Correções Implementadas
 * Testa as funcionalidades principais que foram corrigidas
 */

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

console.log('🧪 Iniciando testes das correções implementadas...\n')

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
  console.log('📊 Teste 1: KPIs do Dashboard')
  console.log('Endpoint: GET /api/dashboard/kpis')
  
  const kpisResult = await testAPI('/api/dashboard/kpis')
  if (kpisResult.success) {
    console.log('✅ KPIs carregados com sucesso')
    console.log(`   - Total de locações: ${kpisResult.data.totalBookings}`)
    console.log(`   - Total de produtos: ${kpisResult.data.totalProducts}`)
    console.log(`   - Total de clientes: ${kpisResult.data.totalClients}`)
    console.log(`   - Receita total: R$ ${kpisResult.data.totalRevenue}`)
  } else {
    console.log('❌ Falha ao carregar KPIs:', kpisResult.error || kpisResult.data?.error)
  }
  
  console.log('')

  console.log('🔍 Teste 2: Status do Sistema')
  console.log('Endpoint: GET /api/system/status')
  
  const systemResult = await testAPI('/api/system/status')
  if (systemResult.success) {
    console.log('✅ Status do sistema obtido com sucesso')
    console.log(`   - Produtos: ${systemResult.data.systemStatus.overview.totalProducts}`)
    console.log(`   - Acessórios: ${systemResult.data.systemStatus.overview.totalAccessories}`)
    console.log(`   - Equipamentos: ${systemResult.data.systemStatus.overview.totalEquipment}`)
    console.log(`   - Locações ativas: ${systemResult.data.systemStatus.overview.totalActiveBookings}`)
  } else {
    console.log('❌ Falha ao obter status do sistema:', systemResult.error || systemResult.data?.error)
  }
  
  console.log('')

  console.log('📅 Teste 3: Verificação de Disponibilidade')
  console.log('Endpoint: POST /api/availability/check')
  
  const availabilityBody = {
    startDate: '2025-08-26',
    endDate: '2025-08-27',
    products: [
      { productId: 'test-product', meters: 1 }
    ]
  }
  
  const availabilityResult = await testAPI('/api/availability/check', 'POST', availabilityBody)
  if (availabilityResult.success) {
    console.log('✅ Verificação de disponibilidade funcionando')
    console.log(`   - Status geral: ${availabilityResult.data.available ? 'Disponível' : 'Indisponível'}`)
    console.log(`   - Itens verificados: ${availabilityResult.data.results?.length || 0}`)
  } else {
    console.log('❌ Falha na verificação de disponibilidade:', availabilityResult.error || availabilityResult.data?.error)
  }
  
  console.log('')

  console.log('🔧 Teste 4: Manutenção do Inventário')
  console.log('Endpoint: GET /api/inventory/maintenance')
  
  const maintenanceResult = await testAPI('/api/inventory/maintenance')
  if (maintenanceResult.success) {
    console.log('✅ Manutenção do inventário funcionando')
    console.log(`   - Status: ${maintenanceResult.data.message || 'OK'}`)
  } else {
    console.log('❌ Falha na manutenção do inventário:', maintenanceResult.error || maintenanceResult.data?.error)
  }
  
  console.log('')

  console.log('📋 Resumo dos Testes:')
  console.log('========================')
  
  const tests = [
    { name: 'KPIs do Dashboard', result: kpisResult.success },
    { name: 'Status do Sistema', result: systemResult.success },
    { name: 'Verificação de Disponibilidade', result: availabilityResult.success },
    { name: 'Manutenção do Inventário', result: maintenanceResult.success }
  ]
  
  const passedTests = tests.filter(t => t.result).length
  const totalTests = tests.length
  
  tests.forEach(test => {
    const status = test.result ? '✅' : '❌'
    console.log(`${status} ${test.name}`)
  })
  
  console.log('')
  console.log(`🎯 Resultado: ${passedTests}/${totalTests} testes passaram`)
  
  if (passedTests === totalTests) {
    console.log('🎉 Todas as correções estão funcionando corretamente!')
  } else {
    console.log('⚠️  Algumas correções ainda precisam de ajustes')
  }
}

// Executar testes
runTests().catch(console.error)
