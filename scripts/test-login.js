const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testLogin() {
  try {
    console.log('🧪 Testando login diretamente no banco...')
    
    const testEmail = 'marcos08limadacunha@gmail.com'
    const testPassword = '123456' // Senha que você usou no registro
    
    console.log(`📧 Testando com email: ${testEmail}`)
    console.log(`🔑 Testando com senha: ${testPassword}`)
    
    // Buscar usuário
    const user = await prisma.user.findFirst({
      where: { email: testEmail },
      include: { company: true }
    })
    
    if (!user) {
      console.log('❌ Usuário não encontrado')
      return
    }
    
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company.name,
      hasPassword: !!user.password,
      passwordLength: user.password.length
    })
    
    // Verificar senha
    console.log('🔐 Verificando senha...')
    const isValid = await bcrypt.compare(testPassword, user.password)
    console.log('🔑 Senha válida:', isValid ? 'SIM' : 'NÃO')
    
    if (isValid) {
      console.log('🎉 Login funcionando! O problema está no frontend ou na API')
    } else {
      console.log('❌ Senha inválida. Verifique se a senha está correta')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()
