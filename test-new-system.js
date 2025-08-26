// Teste do novo sistema de autenticação
const fetch = require('node-fetch').default

async function testNewSystem() {
  try {
    console.log('🧪 Testando novo sistema de autenticação...')
    
    // Teste 1: Login
    console.log('\n1️⃣ Testando login...')
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
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json()
      console.log('✅ Login bem-sucedido!')
      console.log('👤 Usuário:', loginData.user.name)
      console.log('🔑 Sessão:', loginData.sessionId ? 'SIM' : 'NÃO')
      
      // Teste 2: Verificar sessão
      console.log('\n2️⃣ Testando verificação de sessão...')
      const cookies = loginResponse.headers.get('set-cookie')
      console.log('🍪 Cookies recebidos:', cookies ? 'SIM' : 'NÃO')
      
      if (cookies) {
        const sessionCookie = cookies.split(';')[0]
        console.log('🔑 Cookie de sessão:', sessionCookie)
        
        // Teste 3: Acessar /api/auth/me
        console.log('\n3️⃣ Testando acesso a /api/auth/me...')
        const meResponse = await fetch('http://localhost:3000/api/auth/me', {
          headers: {
            'Cookie': sessionCookie
          }
        })
        
        if (meResponse.ok) {
          const meData = await meResponse.json()
          console.log('✅ Sessão válida!')
          console.log('👤 Usuário autenticado:', meData.user.name)
        } else {
          console.log('❌ Erro na verificação de sessão:', meResponse.status)
        }
      }
      
    } else {
      const errorData = await loginResponse.json()
      console.log('❌ Erro no login:', errorData.error)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Aguardar um pouco para o servidor inicializar
setTimeout(testNewSystem, 3000)
