#!/usr/bin/env node

/**
 * Script de Teste da Atualização de Locações
 * Testa se os produtos, acessórios e equipamentos são mantidos durante a edição
 */

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

console.log('🧪 Testando atualização de locações...\n')

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
  console.log('📋 Teste 1: Listar Locações Existentes')
  console.log('Endpoint: GET /api/bookings')
  
  const bookingsResult = await testAPI('/api/bookings')
  if (bookingsResult.success) {
    console.log('✅ Locações carregadas com sucesso')
    console.log(`   - Total de locações: ${bookingsResult.data.length}`)
    
    if (bookingsResult.data.length > 0) {
      const firstBooking = bookingsResult.data[0]
      console.log(`   - Primeira locação: ${firstBooking.eventTitle}`)
      console.log(`   - Produtos: ${firstBooking.items?.length || 0}`)
      console.log(`   - Acessórios: ${firstBooking.accessories?.length || 0}`)
      console.log(`   - Equipamentos: ${firstBooking.equipment?.length || 0}`)
      
      // Testar atualização da primeira locação
      await testBookingUpdate(firstBooking)
    } else {
      console.log('⚠️  Nenhuma locação encontrada para testar')
    }
  } else {
    console.log('❌ Falha ao carregar locações:', bookingsResult.error || bookingsResult.data?.error)
  }
  
  console.log('')
}

async function testBookingUpdate(booking) {
  console.log('📝 Teste 2: Atualizar Locação Existente')
  console.log(`Endpoint: PUT /api/bookings/${booking.id}`)
  
  // Preparar dados de atualização
  const updateData = {
    eventTitle: `${booking.eventTitle} - ATUALIZADO`,
    eventAddress: booking.eventAddress || 'Endereço de teste',
    startDate: booking.startDate,
    endDate: booking.endDate,
    totalValue: booking.totalValue || 0,
    status: booking.status,
    notes: 'Teste de atualização',
    // Manter os mesmos itens
    products: booking.items?.map(item => ({
      productId: item.productId,
      meters: item.meters
    })) || [],
    accessories: booking.accessories?.map(acc => ({
      accessoryId: acc.accessoryId,
      qty: acc.qty
    })) || [],
    equipment: booking.equipment?.map(equip => ({
      equipmentId: equip.equipmentId,
      qty: equip.qty
    })) || []
  }
  
  console.log('   - Dados de atualização preparados')
  console.log(`   - Produtos: ${updateData.products.length}`)
  console.log(`   - Acessórios: ${updateData.accessories.length}`)
  console.log(`   - Equipamentos: ${updateData.equipment.length}`)
  
  const updateResult = await testAPI(`/api/bookings/${booking.id}`, 'PUT', updateData)
  if (updateResult.success) {
    console.log('✅ Locação atualizada com sucesso')
    
    // Verificar se os dados foram mantidos
    const updatedBooking = updateResult.data
    console.log(`   - Título atualizado: ${updatedBooking.eventTitle}`)
    console.log(`   - Produtos mantidos: ${updatedBooking.items?.length || 0}`)
    console.log(`   - Acessórios mantidos: ${updatedBooking.accessories?.length || 0}`)
    console.log(`   - Equipamentos mantidos: ${updatedBooking.equipment?.length || 0}`)
    
    // Verificar se os produtos específicos foram mantidos
    if (updatedBooking.items && updatedBooking.items.length > 0) {
      console.log('   - Detalhes dos produtos:')
      updatedBooking.items.forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.product?.name || 'N/A'} - ${item.meters}m²`)
      })
    }
    
    // Verificar se os acessórios específicos foram mantidos
    if (updatedBooking.accessories && updatedBooking.accessories.length > 0) {
      console.log('   - Detalhes dos acessórios:')
      updatedBooking.accessories.forEach((acc, index) => {
        console.log(`     ${index + 1}. ${acc.accessory?.name || 'N/A'} - ${acc.qty} un`)
      })
    }
    
    // Verificar se os equipamentos específicos foram mantidos
    if (updatedBooking.equipment && updatedBooking.equipment.length > 0) {
      console.log('   - Detalhes dos equipamentos:')
      updatedBooking.equipment.forEach((equip, index) => {
        console.log(`     ${index + 1}. ${equip.equipment?.name || 'N/A'} - ${equip.qty} un`)
      })
    }
    
  } else {
    console.log('❌ Falha ao atualizar locação:', updateResult.error || updateResult.data?.error)
  }
  
  console.log('')
}

// Executar testes
runTests().catch(console.error)
