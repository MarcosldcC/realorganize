# Script para instalar PostgreSQL local
# Execute como administrador

Write-Host "🐘 Instalando PostgreSQL Local..." -ForegroundColor Green

# Verificar se o Chocolatey está instalado
if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host "📦 Chocolatey encontrado! Instalando via Chocolatey..." -ForegroundColor Yellow
    choco install postgresql -y
} else {
    Write-Host "📥 Chocolatey não encontrado. Baixando PostgreSQL manualmente..." -ForegroundColor Yellow
    
    # URL do PostgreSQL
    $postgresUrl = "https://get.enterprisedb.com/postgresql/postgresql-15.5-1-windows-x64.exe"
    $installerPath = "$env:TEMP\postgresql-installer.exe"
    
    Write-Host "⬇️ Baixando PostgreSQL..." -ForegroundColor Blue
    Invoke-WebRequest -Uri $postgresUrl -OutFile $installerPath
    
    Write-Host "🚀 Executando instalador..." -ForegroundColor Blue
    Write-Host "⚠️ IMPORTANTE: Durante a instalação:" -ForegroundColor Red
    Write-Host "   - Porta: 5432" -ForegroundColor White
    Write-Host "   - Senha: postgres" -ForegroundColor White
    Write-Host "   - Usuário: postgres" -ForegroundColor White
    
    Start-Process -FilePath $installerPath -Wait
}

Write-Host "✅ PostgreSQL instalado!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Reinicie o terminal" -ForegroundColor White
Write-Host "2. Execute: psql --version" -ForegroundColor White
Write-Host "3. Crie o banco: CREATE DATABASE led_rental_db;" -ForegroundColor White
Write-Host "4. Configure o .env com as credenciais" -ForegroundColor White
Write-Host "5. Execute: npx prisma migrate dev --name init" -ForegroundColor White
Write-Host ""
Write-Host "📖 Veja POSTGRESQL-LOCAL-SETUP.md para mais detalhes" -ForegroundColor Cyan
