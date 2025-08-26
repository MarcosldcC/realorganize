const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetPassword() {
  try {
    console.log('🔧 Resetando senha do usuário...')
    
    const email = 'marcos08limadacunha@gmail.com'
    const newPassword = '123456'
    
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Nova senha: ${newPassword}`)
    
    // Primeiro buscar o usuário para obter o ID
    const user = await prisma.user.findFirst({
      where: { email },
      include: { company: true }
    })
    
    if (!user) {
      console.log('❌ Usuário não encontrado')
      return
    }
    
    console.log('👤 Usuário encontrado:', user.name)
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    console.log('🔐 Nova senha hasheada com sucesso')
    
    // Atualizar usuário usando o ID
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })
    
    console.log('✅ Senha atualizada com sucesso!')
    
    // Testar login
    console.log('🧪 Testando login com nova senha...')
    const testUser = await prisma.user.findFirst({
      where: { id: user.id },
      include: { company: true }
    })
    
    const isValid = await bcrypt.compare(newPassword, testUser.password)
    console.log('🔑 Login funcionando:', isValid ? 'SIM' : 'NÃO')
    
    if (isValid) {
      console.log('🎉 Agora você pode fazer login com:')
      console.log(`   Email: ${email}`)
      console.log(`   Senha: ${newPassword}`)
    }
    
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetPassword()
