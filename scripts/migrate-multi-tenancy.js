const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateToMultiTenancy() {
  try {
    console.log('🚀 Iniciando migração para multi-tenancy...')

    // 1. Criar uma empresa padrão para dados existentes
    console.log('📝 Criando empresa padrão...')
    const defaultCompany = await prisma.company.create({
      data: {
        name: 'Empresa Padrão',
        email: 'admin@default.com'
      }
    })
    console.log('✅ Empresa padrão criada:', defaultCompany.id)

    // 2. Atualizar usuários existentes
    console.log('👥 Atualizando usuários existentes...')
    const users = await prisma.user.findMany()
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { companyId: defaultCompany.id }
      })
    }
    console.log(`✅ ${users.length} usuários atualizados`)

    // 3. Atualizar produtos existentes
    console.log('📦 Atualizando produtos existentes...')
    const products = await prisma.product.findMany()
    for (const product of products) {
      await prisma.product.update({
        where: { id: product.id },
        data: { companyId: defaultCompany.id }
      })
    }
    console.log(`✅ ${products.length} produtos atualizados`)

    // 4. Atualizar acessórios existentes
    console.log('🔧 Atualizando acessórios existentes...')
    const accessories = await prisma.accessory.findMany()
    for (const accessory of accessories) {
      await prisma.accessory.update({
        where: { id: accessory.id },
        data: { companyId: defaultCompany.id }
      })
    }
    console.log(`✅ ${accessories.length} acessórios atualizados`)

    // 5. Atualizar equipamentos existentes
    console.log('⚡ Atualizando equipamentos existentes...')
    const equipment = await prisma.equipment.findMany()
    for (const item of equipment) {
      await prisma.equipment.update({
        where: { id: item.id },
        data: { companyId: defaultCompany.id }
      })
    }
    console.log(`✅ ${equipment.length} equipamentos atualizados`)

    // 6. Atualizar clientes existentes
    console.log('👤 Atualizando clientes existentes...')
    const clients = await prisma.client.findMany()
    for (const client of clients) {
      await prisma.client.update({
        where: { id: client.id },
        data: { companyId: defaultCompany.id }
      })
    }
    console.log(`✅ ${clients.length} clientes atualizados`)

    // 7. Atualizar locações existentes
    console.log('📅 Atualizando locações existentes...')
    const bookings = await prisma.booking.findMany()
    for (const booking of bookings) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { companyId: defaultCompany.id }
      })
    }
    console.log(`✅ ${bookings.length} locações atualizadas`)

    // 8. Atualizar atividades existentes
    console.log('📊 Atualizando atividades existentes...')
    const activities = await prisma.activity.findMany()
    for (const activity of activities) {
      await prisma.activity.update({
        where: { id: activity.id },
        data: { companyId: defaultCompany.id }
      })
    }
    console.log(`✅ ${activities.length} atividades atualizadas`)

    // 9. Atualizar lembretes existentes
    console.log('🔔 Atualizando lembretes existentes...')
    const reminders = await prisma.reminder.findMany()
    for (const reminder of reminders) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { companyId: defaultCompany.id }
      })
    }
    console.log(`✅ ${reminders.length} lembretes atualizados`)

    console.log('🎉 Migração para multi-tenancy concluída com sucesso!')
    console.log(`📊 Empresa padrão criada: ${defaultCompany.name} (${defaultCompany.id})`)
    console.log('💡 Agora cada nova conta terá sua própria empresa isolada')

  } catch (error) {
    console.error('❌ Erro durante a migração:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar a migração
migrateToMultiTenancy()
  .then(() => {
    console.log('✅ Script de migração executado com sucesso')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Falha na migração:', error)
    process.exit(1)
  })
