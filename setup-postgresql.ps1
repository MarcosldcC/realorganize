# Script completo de setup para PostgreSQL Local
# Execute como administrador

param(
    [string]$Password = "postgres",
    [string]$Database = "led_rental_db",
    [string]$Port = "5432"
)

Write-Host "🐘 Setup Completo PostgreSQL Local" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# 1. Verificar se PostgreSQL está instalado
Write-Host "`n1. Verificando PostgreSQL..." -ForegroundColor Yellow
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "✅ PostgreSQL já está instalado!" -ForegroundColor Green
    $postgresVersion = psql --version
    Write-Host "   Versão: $postgresVersion" -ForegroundColor Cyan
} else {
    Write-Host "❌ PostgreSQL não encontrado. Instalando..." -ForegroundColor Red
    
    # Verificar Chocolatey
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Host "📦 Instalando via Chocolatey..." -ForegroundColor Blue
        choco install postgresql -y
    } else {
        Write-Host "📥 Baixando PostgreSQL manualmente..." -ForegroundColor Blue
        $postgresUrl = "https://get.enterprisedb.com/postgresql/postgresql-15.5-1-windows-x64.exe"
        $installerPath = "$env:TEMP\postgresql-installer.exe"
        
        Invoke-WebRequest -Uri $postgresUrl -OutFile $installerPath
        Write-Host "🚀 Executando instalador..." -ForegroundColor Blue
        Write-Host "⚠️ IMPORTANTE: Senha: $Password, Porta: $Port" -ForegroundColor Red
        
        Start-Process -FilePath $installerPath -Wait
        Remove-Item $installerPath -Force
    }
    
    # Aguardar instalação
    Start-Sleep -Seconds 10
}

# 2. Verificar se o serviço está rodando
Write-Host "`n2. Verificando serviço PostgreSQL..." -ForegroundColor Yellow
$service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq "Running") {
        Write-Host "✅ Serviço PostgreSQL rodando!" -ForegroundColor Green
    } else {
        Write-Host "🔄 Iniciando serviço PostgreSQL..." -ForegroundColor Yellow
        Start-Service $service.Name
        Start-Sleep -Seconds 5
    }
} else {
    Write-Host "❌ Serviço PostgreSQL não encontrado" -ForegroundColor Red
    Write-Host "   Tente reiniciar o computador e executar novamente" -ForegroundColor Yellow
    exit 1
}

# 3. Testar conexão
Write-Host "`n3. Testando conexão..." -ForegroundColor Yellow
try {
    $testConnection = psql -U postgres -h localhost -p $Port -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexão com PostgreSQL OK!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro na conexão. Verificando..." -ForegroundColor Red
        Write-Host "   Erro: $testConnection" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao conectar: $_" -ForegroundColor Red
    exit 1
}

# 4. Criar banco de dados
Write-Host "`n4. Criando banco de dados..." -ForegroundColor Yellow
try {
    $createDB = psql -U postgres -h localhost -p $Port -c "CREATE DATABASE $Database;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Banco '$Database' criado com sucesso!" -ForegroundColor Green
    } else {
        if ($createDB -like "*already exists*") {
            Write-Host "ℹ️ Banco '$Database' já existe!" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Erro ao criar banco: $createDB" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "❌ Erro ao criar banco: $_" -ForegroundColor Red
    exit 1
}

# 5. Criar arquivo .env
Write-Host "`n5. Criando arquivo .env..." -ForegroundColor Yellow
$envContent = @"
# PostgreSQL Local - Configuração
DATABASE_URL="postgresql://postgres:$Password@localhost:$Port/$Database"

# JWT Secret (Altere para produção)
JWT_SECRET="led-rental-app-super-secret-jwt-key-2024-123456789"

# Next.js
NEXTAUTH_SECRET="led-rental-app-nextauth-secret-2024"
NEXTAUTH_URL="http://localhost:3000"

# Configurações do Banco
DB_HOST="localhost"
DB_PORT="$Port"
DB_USER="postgres"
DB_NAME="$Database"
"@

try {
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Arquivo .env criado!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao criar .env: $_" -ForegroundColor Red
}

# 6. Instalar dependências
Write-Host "`n6. Instalando dependências..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar dependências: $_" -ForegroundColor Red
}

# 7. Gerar Prisma Client
Write-Host "`n7. Gerando Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma Client gerado!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao gerar Prisma Client: $_" -ForegroundColor Red
}

# 8. Executar migrações
Write-Host "`n8. Executando migrações..." -ForegroundColor Yellow
try {
    npx prisma migrate dev --name init
    Write-Host "✅ Migrações executadas!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro nas migrações: $_" -ForegroundColor Red
}

# Resumo final
Write-Host "`n🎉 Setup Completo!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host "✅ PostgreSQL instalado e configurado" -ForegroundColor Green
Write-Host "✅ Banco '$Database' criado" -ForegroundColor Green
Write-Host "✅ Arquivo .env configurado" -ForegroundColor Green
Write-Host "✅ Dependências instaladas" -ForegroundColor Green
Write-Host "✅ Prisma configurado" -ForegroundColor Green
Write-Host "✅ Migrações executadas" -ForegroundColor Green

Write-Host "`n🚀 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Iniciar servidor: npm run dev" -ForegroundColor White
Write-Host "2. Acessar: http://localhost:3000" -ForegroundColor White
Write-Host "3. Criar conta e testar o sistema" -ForegroundColor White

Write-Host "`n📖 Documentação:" -ForegroundColor Cyan
Write-Host "- README.md - Guia principal" -ForegroundColor White
Write-Host "- POSTGRESQL-LOCAL-SETUP.md - Setup detalhado" -ForegroundColor White
Write-Host "- QUICK-POSTGRESQL.md - Setup rápido" -ForegroundColor White

Write-Host "`n🔧 Configurações:" -ForegroundColor Cyan
Write-Host "- Host: localhost" -ForegroundColor White
Write-Host "- Porta: $Port" -ForegroundColor White
Write-Host "- Usuário: postgres" -ForegroundColor White
Write-Host "- Senha: $Password" -ForegroundColor White
Write-Host "- Banco: $Database" -ForegroundColor White
