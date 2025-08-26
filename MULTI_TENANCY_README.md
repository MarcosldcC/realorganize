# Sistema de Multi-Tenancy - LED Rental Pro

## 🚀 Visão Geral

O sistema foi atualizado para implementar **multi-tenancy completo**, garantindo que cada conta seja totalmente independente, com seus próprios dados, locações e informações. Nada é compartilhado entre contas.

## 🔒 Características de Segurança

- **Isolamento Total**: Cada empresa tem acesso apenas aos seus próprios dados
- **Company ID**: Todas as entidades são vinculadas a um `companyId` específico
- **Middleware de Autenticação**: Verifica tokens e adiciona `companyId` aos headers
- **Filtros Automáticos**: Todas as consultas são automaticamente filtradas por empresa

## 🏗️ Arquitetura

### Modelo de Dados

```prisma
model Company {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  // ... outros campos
  
  users       User[]
  products    Product[]
  accessories Accessory[]
  clients     Client[]
  bookings    Booking[]
  equipment   Equipment[]
  activities  Activity[]
  reminders   Reminder[]
}

model User {
  id        String   @id @default(cuid())
  email     String
  password  String
  name      String
  companyId String  // 🔑 Chave para isolamento
  
  company   Company @relation(fields: [companyId], references: [id])
  
  @@unique([email, companyId]) // Email único por empresa
}
```

### Middleware de Autenticação

O middleware (`src/middleware.ts`) intercepta todas as requisições e:

1. **Verifica autenticação** para rotas protegidas
2. **Adiciona headers** com `companyId` e `userId`
3. **Redireciona** usuários não autenticados para login

### APIs com Filtros Automáticos

Todas as APIs agora incluem automaticamente o `companyId`:

```typescript
// Exemplo: API de Produtos
export async function GET() {
  const companyId = getCompanyIdFromHeaders()
  
  const products = await prisma.product.findMany({
    where: { companyId }, // 🔒 Filtro automático por empresa
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(products)
}
```

## 📋 Como Usar

### 1. Criação de Nova Conta

Ao registrar uma nova conta, o sistema:

1. **Cria uma nova empresa** com os dados fornecidos
2. **Cria um usuário** vinculado à empresa
3. **Gera um token JWT** com `companyId` incluído

```typescript
// Exemplo de registro
const user = await createUser(email, password, name, companyName)
// ✅ Empresa e usuário criados automaticamente
```

### 2. Login e Autenticação

O login retorna um token JWT que inclui:

```typescript
{
  userId: "user_id",
  email: "user@company.com",
  companyId: "company_id" // 🔑 Para isolamento
}
```

### 3. Acesso aos Dados

Todas as consultas são automaticamente filtradas:

```typescript
// ✅ Apenas produtos da empresa do usuário
const products = await prisma.product.findMany({
  where: { companyId: userCompanyId }
})

// ✅ Apenas clientes da empresa do usuário
const clients = await prisma.client.findMany({
  where: { companyId: userCompanyId }
})
```

## 🔄 Migração de Dados Existentes

Para sistemas com dados existentes, execute o script de migração:

```bash
cd led-rental-app
node scripts/migrate-multi-tenancy.js
```

Este script:

1. **Cria uma empresa padrão** para dados existentes
2. **Atualiza todas as entidades** com o `companyId` correto
3. **Preserva dados existentes** durante a transição

## 🛡️ Segurança Implementada

### Nível de Aplicação

- **Middleware de autenticação** em todas as rotas
- **Validação de tokens** JWT
- **Headers seguros** com `companyId`

### Nível de Banco de Dados

- **Constraints de chave estrangeira** com `onDelete: Cascade`
- **Índices únicos** por empresa (ex: `@@unique([code, companyId])`)
- **Relacionamentos** que garantem isolamento

### Nível de API

- **Filtros automáticos** em todas as consultas
- **Validação de `companyId`** em todas as operações
- **Erros de segurança** para tentativas de acesso não autorizado

## 🧪 Testando o Sistema

### 1. Criar Múltiplas Contas

```bash
# Conta 1: Empresa A
POST /api/auth/register
{
  "name": "João Silva",
  "email": "joao@empresaa.com",
  "password": "senha123",
  "companyName": "Empresa A"
}

# Conta 2: Empresa B
POST /api/auth/register
{
  "name": "Maria Santos",
  "email": "maria@empresab.com",
  "password": "senha456",
  "companyName": "Empresa B"
}
```

### 2. Verificar Isolamento

- **Login na Empresa A**: Criar produtos, clientes, locações
- **Login na Empresa B**: Verificar que não vê dados da Empresa A
- **Criar dados na Empresa B**: Verificar que são independentes

## 🚨 Considerações Importantes

### Antes da Migração

1. **Backup do banco** de dados existente
2. **Teste em ambiente** de desenvolvimento
3. **Verificação** de todas as APIs

### Durante a Migração

1. **Sistema offline** para evitar conflitos
2. **Execução do script** de migração
3. **Verificação** de integridade dos dados

### Após a Migração

1. **Teste completo** de todas as funcionalidades
2. **Verificação** de isolamento entre contas
3. **Monitoramento** de performance

## 📊 Benefícios

- ✅ **Segurança Total**: Isolamento completo entre empresas
- ✅ **Escalabilidade**: Suporte a milhares de empresas
- ✅ **Manutenibilidade**: Código mais limpo e organizado
- ✅ **Conformidade**: Atende requisitos de LGPD e segurança
- ✅ **Flexibilidade**: Cada empresa pode ter suas próprias configurações

## 🆘 Suporte

Para dúvidas ou problemas:

1. **Verifique os logs** do sistema
2. **Consulte a documentação** da API
3. **Execute testes** de isolamento
4. **Verifique** as constraints do banco de dados

---

**Sistema LED Rental Pro** - Multi-Tenancy Completo e Seguro 🚀
