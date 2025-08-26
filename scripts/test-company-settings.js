const fetch = require('node-fetch')
const BASE_URL = 'http://localhost:3000'

async function testCompanySettings() {
  console.log('🏢 TESTANDO CONFIGURAÇÕES DA EMPRESA\n')

  try {
    // Teste 1: GET /api/company-settings (Buscar configurações atuais)
    console.log('📊 Teste 1: Buscar configurações atuais da empresa')
    const getResponse = await fetch(`${BASE_URL}/api/company-settings`)
    if (getResponse.ok) {
      const currentSettings = await getResponse.json()
      console.log('✅ Configurações carregadas com sucesso:')
      console.log(`   - Nome: ${currentSettings.name}`)
      console.log(`   - Email: ${currentSettings.email}`)
      console.log(`   - Telefone: ${currentSettings.phone}`)
      console.log(`   - CNPJ: ${currentSettings.cnpj || 'Não informado'}`)
      console.log(`   - Endereço: ${currentSettings.address}`)
    } else {
      console.log('❌ Erro ao carregar configurações')
      return
    }

    // Teste 2: PUT /api/company-settings (Atualizar configurações)
    console.log('\n✏️  Teste 2: Atualizar configurações da empresa')
    
    const newSettings = {
      name: 'LED Rentals Pro',
      email: 'contato@ledrentalspro.com',
      phone: '(21) 98888-7777',
      cnpj: '12.345.678/0001-90',
      address: 'Av. Copacabana, 456 - Rio de Janeiro, RJ'
    }

    const putResponse = await fetch(`${BASE_URL}/api/company-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    })

    if (putResponse.ok) {
      const result = await putResponse.json()
      console.log('✅ Configurações atualizadas com sucesso:')
      console.log(`   - Mensagem: ${result.message}`)
      console.log(`   - Nome atualizado: ${result.data.name}`)
      console.log(`   - Email atualizado: ${result.data.email}`)
    } else {
      const errorData = await putResponse.json()
      console.log('❌ Erro ao atualizar configurações:', errorData.error || 'Erro desconhecido')
      return
    }

    // Teste 3: Verificar se as alterações foram salvas
    console.log('\n🔄 Teste 3: Verificar se as alterações foram salvas')
    const verifyResponse = await fetch(`${BASE_URL}/api/company-settings`)
    if (verifyResponse.ok) {
      const updatedSettings = await verifyResponse.json()
      console.log('✅ Configurações verificadas após atualização:')
      console.log(`   - Nome: ${updatedSettings.name}`)
      console.log(`   - Email: ${updatedSettings.email}`)
      console.log(`   - Telefone: ${updatedSettings.phone}`)
      console.log(`   - CNPJ: ${updatedSettings.cnpj || 'Não informado'}`)
      console.log(`   - Endereço: ${updatedSettings.address}`)
      
      // Verificar se as alterações foram aplicadas
      if (updatedSettings.name === newSettings.name && 
          updatedSettings.email === newSettings.email) {
        console.log('✅ Todas as alterações foram aplicadas corretamente!')
      } else {
        console.log('❌ Algumas alterações não foram aplicadas')
      }
    } else {
      console.log('❌ Erro ao verificar configurações atualizadas')
    }

    // Teste 4: Testar validação de campos obrigatórios
    console.log('\n⚠️  Teste 4: Testar validação de campos obrigatórios')
    const invalidSettings = {
      name: '',
      email: 'email-invalido',
      phone: '',
      address: ''
    }

    const validationResponse = await fetch(`${BASE_URL}/api/company-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidSettings)
    })

    if (validationResponse.status === 400) {
      const errorData = await validationResponse.json()
      console.log('✅ Validação funcionando corretamente:')
      console.log(`   - Erro: ${errorData.error}`)
    } else {
      console.log('❌ Validação não está funcionando como esperado')
    }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message)
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes das configurações da empresa...\n')
  
  try {
    await testCompanySettings()
    console.log('\n✅ Todos os testes das configurações concluídos!')
  } catch (error) {
    console.error('\n❌ Erro durante a execução dos testes:', error)
  }
}

if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = { testCompanySettings, runAllTests }
