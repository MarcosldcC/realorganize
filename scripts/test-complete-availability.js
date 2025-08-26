const fetch = require('node-fetch')
const BASE_URL = 'http://localhost:3000'

async function testCompleteAvailabilitySystem() {
  console.log('🧪 TESTANDO SISTEMA COMPLETO DE DISPONIBILIDADE\n')

  try {
    // Teste 1: GET /api/availability (Status atual do sistema)
    console.log('📊 Teste 1: Status atual do sistema')
    const systemResponse = await fetch(`${BASE_URL}/api/availability`)
    if (systemResponse.ok) {
      const systemData = await systemResponse.json()
      console.log('✅ Status do sistema carregado com sucesso')
      console.log(`   - Produtos: ${systemData.summary.totalProducts}`)
      console.log(`   - Acessórios: ${systemData.summary.totalAccessories}`)
      console.log(`   - Equipamentos: ${systemData.summary.totalEquipment}`)
      console.log(`   - Metros disponíveis: ${systemData.summary.availableProductMeters}`)
      console.log(`   - Unidades disponíveis: ${systemData.summary.availableAccessoryQty + systemData.summary.availableEquipmentQty}`)
    } else {
      console.log('❌ Erro ao carregar status do sistema')
    }

    // Teste 2: POST /api/availability (Verificação de disponibilidade)
    console.log('\n🔍 Teste 2: Verificação de disponibilidade para período específico')
    
    // Buscar produtos disponíveis primeiro
    const productsResponse = await fetch(`${BASE_URL}/api/products`)
    let sampleProductId = null
    let sampleAccessoryId = null
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json()
      if (productsData.length > 0) {
        sampleProductId = productsData[0].id
        console.log(`   - Produto de teste encontrado: ${productsData[0].name}`)
      }
    }

    // Buscar acessórios disponíveis
    const accessoriesResponse = await fetch(`${BASE_URL}/api/accessories`)
    if (accessoriesResponse.ok) {
      const accessoriesData = await accessoriesResponse.json()
      if (accessoriesData.length > 0) {
        sampleAccessoryId = accessoriesData[0].id
        console.log(`   - Acessório de teste encontrado: ${accessoriesData[0].name}`)
      }
    }

    if (sampleProductId || sampleAccessoryId) {
      const testData = {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias no futuro
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 dias no futuro
        items: []
      }

      if (sampleProductId) {
        testData.items.push({
          type: 'PRODUTO',
          id: sampleProductId,
          quantity: 5,
          unit: 'metros'
        })
      }

      if (sampleAccessoryId) {
        testData.items.push({
          type: 'ACESSÓRIO',
          id: sampleAccessoryId,
          quantity: 2,
          unit: 'unidades'
        })
      }

      const availabilityResponse = await fetch(`${BASE_URL}/api/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json()
        console.log('✅ Verificação de disponibilidade realizada com sucesso')
        console.log(`   - Status geral: ${availabilityData.available ? 'Disponível' : 'Indisponível'}`)
        console.log(`   - Total de itens verificados: ${availabilityData.summary.totalItems}`)
        console.log(`   - Itens disponíveis: ${availabilityData.summary.availableItems}`)
        console.log(`   - Itens indisponíveis: ${availabilityData.summary.unavailableItems}`)
        console.log(`   - Período: ${availabilityData.period.startDate} a ${availabilityData.period.endDate}`)
        
        if (availabilityData.results && availabilityData.results.length > 0) {
          console.log('\n   📋 Detalhes dos itens:')
          availabilityData.results.forEach((item, index) => {
            console.log(`     ${index + 1}. ${item.name} (${item.code})`)
            console.log(`        - Status: ${item.status}`)
            console.log(`        - Solicitado: ${item.requestedQuantity} ${item.unit}`)
            console.log(`        - Disponível: ${item.availableQuantity} ${item.unit}`)
            console.log(`        - Total em estoque: ${item.totalQuantity} ${item.unit}`)
            console.log(`        - Ocupado: ${item.occupiedQuantity} ${item.unit}`)
            
            if (item.occupyingBookings && item.occupyingBookings.length > 0) {
              console.log(`        - Locações ocupando: ${item.occupyingBookings.length}`)
              item.occupyingBookings.forEach((booking, bIndex) => {
                console.log(`          ${bIndex + 1}. ${booking.eventTitle} - ${booking.clientName}`)
                console.log(`             ${booking.startDate} a ${booking.endDate} (${booking.occupiedQuantity} ${item.unit})`)
              })
            }
          })
        }
      } else {
        const errorData = await availabilityResponse.json()
        console.log('❌ Erro na verificação de disponibilidade:', errorData.error || 'Erro desconhecido')
      }
    } else {
      console.log('⚠️  Nenhum produto ou acessório encontrado para teste')
    }

    // Teste 3: Integração com outras APIs
    console.log('\n🔗 Teste 3: Integração com outras APIs do sistema')
    
    const kpisResponse = await fetch(`${BASE_URL}/api/dashboard/kpis`)
    if (kpisResponse.ok) {
      console.log('✅ Dashboard KPIs funcionando')
    } else {
      console.log('❌ Dashboard KPIs com problema')
    }

    const clientsResponse = await fetch(`${BASE_URL}/api/clients`)
    if (clientsResponse.ok) {
      console.log('✅ API de clientes funcionando')
    } else {
      console.log('❌ API de clientes com problema')
    }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message)
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes do sistema de disponibilidade...\n')
  
  try {
    await testCompleteAvailabilitySystem()
    console.log('\n✅ Todos os testes concluídos!')
  } catch (error) {
    console.error('\n❌ Erro durante a execução dos testes:', error)
  }
}

if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = { testCompleteAvailabilitySystem, runAllTests }
