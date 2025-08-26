// Teste do sistema de inventário
const fetch = require('node-fetch').default

async function testInventory() {
  try {
    console.log('🧪 Testando sistema de inventário...')
    
    // 1. Primeiro fazer login para obter sessão
    console.log('\n1️⃣ Fazendo login...')
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'teste@teste.com',
        password: '123456'
      })
    })
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json()
      console.log('❌ Erro no login:', errorData.error)
      return
    }
    
    const loginData = await loginResponse.json()
    console.log('✅ Login bem-sucedido!')
    
    // 2. Extrair cookie de sessão
    const cookies = loginResponse.headers.get('set-cookie')
    if (!cookies) {
      console.log('❌ Nenhum cookie recebido')
      return
    }
    
    const sessionCookie = cookies.split(';')[0]
    console.log('🍪 Cookie de sessão:', sessionCookie)
    
    // 3. Testar criação de produto
    console.log('\n2️⃣ Testando criação de produto...')
    const productData = {
      name: 'Painel LED Teste',
      code: 'LED001',
      description: 'Painel LED de teste para o sistema',
      totalMeters: 10,
      pricePerMeter: 25.50
    }
    
    const productResponse = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(productData)
    })
    
    if (productResponse.ok) {
      const product = await productResponse.json()
      console.log('✅ Produto criado com sucesso!')
      console.log('📦 ID:', product.id)
      console.log('📦 Nome:', product.name)
      console.log('📦 Código:', product.code)
    } else {
      const errorData = await productResponse.json()
      console.log('❌ Erro ao criar produto:', errorData.error)
    }
    
    // 4. Testar criação de acessório
    console.log('\n3️⃣ Testando criação de acessório...')
    const accessoryData = {
      name: 'Cabo de Energia',
      code: 'CAB001',
      description: 'Cabo de energia para painéis LED',
      totalQty: 50,
      pricePerUnit: 15.00
    }
    
    const accessoryResponse = await fetch('http://localhost:3000/api/accessories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(accessoryData)
    })
    
    if (accessoryResponse.ok) {
      const accessory = await accessoryResponse.json()
      console.log('✅ Acessório criado com sucesso!')
      console.log('🔌 ID:', accessory.id)
      console.log('🔌 Nome:', accessory.name)
      console.log('🔌 Código:', accessory.code)
    } else {
      const errorData = await accessoryResponse.json()
      console.log('❌ Erro ao criar acessório:', errorData.error)
    }
    
    // 5. Testar criação de equipamento
    console.log('\n4️⃣ Testando criação de equipamento...')
    const equipmentData = {
      name: 'Gerador de Energia',
      code: 'GEN001',
      description: 'Gerador portátil para eventos',
      totalQty: 5,
      pricePerUnit: 200.00,
      category: 'Energia',
      brand: 'Marca Teste',
      model: 'Modelo 2024'
    }
    
    const equipmentResponse = await fetch('http://localhost:3000/api/equipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(equipmentData)
    })
    
    if (equipmentResponse.ok) {
      const equipment = await equipmentResponse.json()
      console.log('✅ Equipamento criado com sucesso!')
      console.log('⚡ ID:', equipment.id)
      console.log('⚡ Nome:', equipment.name)
      console.log('⚡ Código:', equipment.code)
    } else {
      const errorData = await equipmentResponse.json()
      console.log('❌ Erro ao criar equipamento:', errorData.error)
    }
    
    // 6. Listar todos os itens
    console.log('\n5️⃣ Listando todos os itens...')
    
    const productsResponse = await fetch('http://localhost:3000/api/products', {
      headers: { 'Cookie': sessionCookie }
    })
    if (productsResponse.ok) {
      const products = await productsResponse.json()
      console.log('📦 Produtos:', products.length)
    }
    
    const accessoriesResponse = await fetch('http://localhost:3000/api/accessories', {
      headers: { 'Cookie': sessionCookie }
    })
    if (accessoriesResponse.ok) {
      const accessories = await accessoriesResponse.json()
      console.log('🔌 Acessórios:', accessories.length)
    }
    
    const equipmentResponse2 = await fetch('http://localhost:3000/api/equipment', {
      headers: { 'Cookie': sessionCookie }
    })
    if (equipmentResponse2.ok) {
      const equipment = await equipmentResponse2.json()
      console.log('⚡ Equipamentos:', equipment.length)
    }
    
    console.log('\n🎉 Teste do inventário concluído!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Aguardar um pouco para o servidor inicializar
setTimeout(testInventory, 3000)
