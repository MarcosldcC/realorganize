const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  try {
    // Criar usuário padrão se não existir
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@ledrental.com' }
    })

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('admin123', 12)
      
      await prisma.user.create({
        data: {
          email: 'admin@ledrental.com',
          password: hashedPassword,
          name: 'Administrador'
        }
      })
      
      console.log('✅ Usuário administrador criado')
    } else {
      console.log('ℹ️ Usuário administrador já existe')
    }

    // Criar configurações da empresa se não existir
    const existingSettings = await prisma.companySetting.findFirst()

    if (!existingSettings) {
      await prisma.companySetting.create({
        data: {
          id: 'default-company',
          name: 'LED Rental Company',
          address: 'Rua das Lâmpadas, 123',
          phone: '(11) 99999-9999',
          email: 'contato@ledrental.com',
          cnpj: '12.345.678/0001-90'
        }
      })
      
      console.log('✅ Configurações da empresa criadas')
    } else {
      console.log('ℹ️ Configurações da empresa já existem')
    }

    console.log('🎉 Seed concluído com sucesso!')
  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
