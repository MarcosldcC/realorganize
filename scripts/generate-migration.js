const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Gerando migração do Prisma para multi-tenancy...')

try {
  // Verificar se estamos no diretório correto
  if (!fs.existsSync('prisma/schema.prisma')) {
    console.error('❌ Erro: Execute este script no diretório raiz do projeto')
    process.exit(1)
  }

  // Verificar se o Prisma está instalado
  try {
    execSync('npx prisma --version', { stdio: 'pipe' })
  } catch (error) {
    console.error('❌ Erro: Prisma não está instalado. Execute: npm install')
    process.exit(1)
  }

  console.log('📝 Gerando migração...')
  
  // Gerar a migração
  execSync('npx prisma migrate dev --name add_multi_tenancy', {
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('✅ Migração gerada com sucesso!')
  console.log('')
  console.log('📋 Próximos passos:')
  console.log('1. Execute: npx prisma generate')
  console.log('2. Execute: node scripts/migrate-multi-tenancy.js')
  console.log('3. Teste o sistema com múltiplas contas')
  console.log('')
  console.log('🔒 Sistema de multi-tenancy ativado!')

} catch (error) {
  console.error('❌ Erro ao gerar migração:', error.message)
  console.log('')
  console.log('💡 Soluções possíveis:')
  console.log('1. Verifique se o banco de dados está rodando')
  console.log('2. Verifique as variáveis de ambiente (DATABASE_URL)')
  console.log('3. Execute: npx prisma db push (para desenvolvimento)')
  process.exit(1)
}
