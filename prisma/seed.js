const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar empresa padrão se não existir
  let company = await prisma.company.findFirst({
    where: { email: 'contato@ledrental.com' }
  })

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'LED Rental Company',
        email: 'contato@ledrental.com',
        address: 'Rua das Lâmpadas, 123',
        phone: '(11) 99999-9999',
        cnpj: '12.345.678/0001-90'
      }
    })
    
    console.log('✅ Empresa padrão criada')
  } else {
    console.log('ℹ️ Empresa padrão já existe')
  }

  // Criar usuário padrão se não existir
  const existingUser = await prisma.user.findFirst({
    where: { 
      email: 'admin@ledrental.com',
      companyId: company.id
    }
  })

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    await prisma.user.create({
      data: {
        email: 'admin@ledrental.com',
        password: hashedPassword,
        name: 'Administrador',
        companyId: company.id
      }
    })
    
    console.log('✅ Usuário administrador criado')
  } else {
    console.log('ℹ️ Usuário administrador já existe')
  }

  // NOTA: Equipamentos e usuários devem ser criados através da interface do usuário
  // Não criamos dados automaticamente aqui para garantir que tudo seja inserido pelo usuário final
  console.log('ℹ️ Lembre-se: Equipamentos e usuários devem ser criados através da interface')

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
