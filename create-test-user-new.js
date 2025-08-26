const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    console.log('👤 Criando usuário de teste com novo sistema...')
    
    // Limpar dados existentes
    await prisma.user.deleteMany({})
    await prisma.company.deleteMany({})
    console.log('🗑️ Dados antigos removidos')
    
    // Criar empresa
    const company = await prisma.company.create({
      data: {
        name: 'Empresa Teste Nova',
        email: 'teste@empresa.com'
      }
    })
    console.log('✅ Empresa criada:', company.name)
    
    // Criar usuário
    const hashedPassword = await bcrypt.hash('123456', 12)
    const user = await prisma.user.create({
      data: {
        email: 'teste@teste.com',
        password: hashedPassword,
        name: 'Usuário Teste Novo',
        companyId: company.id
      },
      include: { company: true }
    })
    
    console.log('✅ Usuário criado com sucesso!')
    console.log('📧 Email:', user.email)
    console.log('🔑 Senha: 123456')
    console.log('👤 Nome:', user.name)
    console.log('🏢 Empresa:', user.company.name)
    
    console.log('\n🎉 Sistema pronto para teste!')
    console.log('💡 Use as credenciais acima para fazer login')
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
