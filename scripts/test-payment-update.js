#!/usr/bin/env node

/**
 * Script de Teste da Atualização de Status de Pagamento
 * Testa se o status de pagamento é atualizado corretamente
 */

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

console.log('🧪 Testando atualização de status de pagamento...\n')

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
      console.log(`   - Status atual: ${firstBooking.status}`)
      console.log(`   - Status de pagamento atual: ${firstBooking.paymentStatus}`)
      console.log(`   - Valor: R$ ${firstBooking.totalValue}`)
      
      // Testar atualização do status de pagamento
      await testPaymentStatusUpdate(firstBooking)
    } else {
      console.log('⚠️  Nenhuma locação encontrada para testar')
    }
  } else {
    console.log('❌ Falha ao carregar locações:', bookingsResult.error || bookingsResult.data?.error)
  }
  
  console.log('')
}

async function testPaymentStatusUpdate(booking) {
  console.log('💰 Teste 2: Atualizar Status de Pagamento')
  console.log(`Endpoint: PUT /api/bookings/${booking.id}`)
  
  // Preparar dados de atualização apenas do status de pagamento
  const updateData = {
    eventTitle: booking.eventTitle,
    eventAddress: booking.eventAddress,
    startDate: booking.startDate,
    endDate: booking.endDate,
    totalValue: booking.totalValue,
    status: booking.status,
    paymentStatus: 'PAID', // Alterar para PAID
    notes: booking.notes || 'Teste de atualização de pagamento',
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
  console.log(`   - Status de pagamento anterior: ${booking.paymentStatus}`)
  console.log(`   - Status de pagamento novo: ${updateData.paymentStatus}`)
  
  const updateResult = await testAPI(`/api/bookings/${booking.id}`, 'PUT', updateData)
  if (updateResult.success) {
    console.log('✅ Status de pagamento atualizado com sucesso')
    
    // Verificar se os dados foram atualizados
    const updatedBooking = updateResult.data
    console.log(`   - Status de pagamento atualizado: ${updatedBooking.paymentStatus}`)
    console.log(`   - Título mantido: ${updatedBooking.eventTitle}`)
    console.log(`   - Valor mantido: R$ ${updatedBooking.totalValue}`)
    
  } else {
    console.log('❌ Falha ao atualizar status de pagamento:', updateResult.error || updateResult.data?.error)
  }
  
  console.log('')
  
  // Teste 3: Verificar KPIs após atualização
  console.log('📊 Teste 3: Verificar KPIs Após Atualização')
  console.log('Endpoint: GET /api/dashboard/kpis')
  
  const kpisResult = await testAPI('/api/dashboard/kpis')
  if (kpisResult.success) {
    console.log('✅ KPIs carregados com sucesso após atualização')
    console.log(`   - Receita total: R$ ${kpisResult.data.totalRevenue}`)
    console.log(`   - Receita recebida: R$ ${kpisResult.data.receivedAmount}`)
    console.log(`   - Receita pendente: R$ ${kpisResult.data.pendingAmount}`)
    
    // Verificar se os valores foram atualizados corretamente
    if (kpisResult.data.receivedAmount > 0) {
      console.log('   ✅ Receita recebida atualizada corretamente')
    } else {
      console.log('   ⚠️  Receita recebida não foi atualizada')
    }
    
  } else {
    console.log('❌ Falha ao carregar KPIs:', kpisResult.error || kpisResult.data?.error)
  }
  
  console.log('')
}

// Executar testes
runTests().catch(console.error)
