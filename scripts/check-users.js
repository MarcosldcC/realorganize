const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...')
    
    // Verificar empresas
    const companies = await prisma.company.findMany()
    console.log(`📊 Empresas encontradas: ${companies.length}`)
    companies.forEach(company => {
      console.log(`  - ${company.name} (${company.email}) - ID: ${company.id}`)
    })
    
    // Verificar usuários
    const users = await prisma.user.findMany({
      include: { company: true }
    })
    console.log(`👥 Usuários encontrados: ${users.length}`)
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Empresa: ${user.company.name} - ID: ${user.id}`)
    })
    
    if (users.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado!')
      console.log('💡 Crie uma conta primeiro em /register')
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
