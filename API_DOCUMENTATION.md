# Documentação das APIs - Sistema de Locações LED

## Visão Geral
Este documento descreve todas as APIs ativas e funcionais do sistema de locações LED.

## APIs Ativas

### 1. Dashboard KPIs
- **Endpoint**: `GET /api/dashboard/kpis`
- **Descrição**: Retorna os indicadores de performance do dashboard
- **Funcionalidades**:
  - Total de locações futuras
  - Receita pendente
  - Total de clientes
  - Receita total
  - Estatísticas de produtos, acessórios e equipamentos

### 2. Verificação de Disponibilidade
- **Endpoint**: `GET /api/availability`
- **Descrição**: Retorna o status atual de disponibilidade do sistema
- **Funcionalidades**:
  - Estoque atual de produtos, acessórios e equipamentos
  - Quantidade ocupada vs. disponível
  - Percentual de utilização
  - Status geral do sistema

- **Endpoint**: `POST /api/availability`
- **Descrição**: Verifica disponibilidade para um período específico
- **Funcionalidades**:
  - Verificação por período (data início/fim)
  - Seleção de itens específicos
  - Cálculo de disponibilidade considerando locações existentes
  - Detalhamento de locações ocupando cada item
  - Recomendações para criação de novas locações

### 3. Gestão de Locações
- **Endpoint**: `GET /api/bookings`
- **Descrição**: Lista todas as locações
- **Funcionalidades**:
  - Listagem com filtros
  - Paginação
  - Inclusão de dados relacionados (cliente, itens, acessórios, equipamentos)

- **Endpoint**: `POST /api/bookings`
- **Descrição**: Cria uma nova locação
- **Funcionalidades**:
  - Criação com validações
  - Associação de produtos, acessórios e equipamentos
  - Cálculo automático de valores
  - Status de pagamento

- **Endpoint**: `GET /api/bookings/[id]`
- **Descrição**: Obtém detalhes de uma locação específica
- **Funcionalidades**:
  - Dados completos da locação
  - Informações do cliente
  - Lista de itens, acessórios e equipamentos

- **Endpoint**: `PUT /api/bookings/[id]`
- **Descrição**: Atualiza uma locação existente
- **Funcionalidades**:
  - Modificação de dados
  - Atualização de status de pagamento
  - Manutenção de histórico

- **Endpoint**: `DELETE /api/bookings/[id]`
- **Descrição**: Remove uma locação
- **Funcionalidades**:
  - Exclusão com validações
  - Liberação de itens ocupados

### 4. Gestão de Produtos
- **Endpoint**: `GET /api/products`
- **Descrição**: Lista todos os produtos
- **Funcionalidades**:
  - Listagem com filtros
  - Dados de estoque e preços

- **Endpoint**: `POST /api/products`
- **Descrição**: Cria um novo produto
- **Funcionalidades**:
  - Cadastro com validações
  - Definição de estoque inicial

- **Endpoint**: `PUT /api/products/[id]`
- **Descrição**: Atualiza um produto
- **Funcionalidades**:
  - Modificação de dados
  - Atualização de estoque

- **Endpoint**: `DELETE /api/products/[id]`
- **Descrição**: Remove um produto
- **Funcionalidades**:
  - Exclusão com validações de uso

### 5. Gestão de Acessórios
- **Endpoint**: `GET /api/accessories`
- **Descrição**: Lista todos os acessórios
- **Funcionalidades**:
  - Listagem com filtros
  - Dados de estoque e preços

- **Endpoint**: `POST /api/accessories`
- **Descrição**: Cria um novo acessório
- **Funcionalidades**:
  - Cadastro com validações
  - Definição de estoque inicial

- **Endpoint**: `PUT /api/accessories/[id]`
- **Descrição**: Atualiza um acessório
- **Funcionalidades**:
  - Modificação de dados
  - Atualização de estoque

- **Endpoint**: `DELETE /api/accessories/[id]`
- **Descrição**: Remove um acessório
- **Funcionalidades**:
  - Exclusão com validações de uso

### 6. Gestão de Equipamentos
- **Endpoint**: `GET /api/equipment`
- **Descrição**: Lista todos os equipamentos
- **Funcionalidades**:
  - Listagem com filtros
  - Dados de estoque e preços

- **Endpoint**: `POST /api/equipment`
- **Descrição**: Cria um novo equipamento
- **Funcionalidades**:
  - Cadastro com validações
  - Definição de estoque inicial

- **Endpoint**: `PUT /api/equipment/[id]`
- **Descrição**: Atualiza um equipamento
- **Funcionalidades**:
  - Modificação de dados
  - Atualização de estoque

- **Endpoint**: `DELETE /api/equipment/[id]`
- **Descrição**: Remove um equipamento
- **Funcionalidades**:
  - Exclusão com validações de uso

### 7. Gestão de Clientes
- **Endpoint**: `GET /api/clients`
- **Descrição**: Lista todos os clientes
- **Funcionalidades**:
  - Listagem com filtros
  - Dados de contato e histórico

- **Endpoint**: `POST /api/clients`
- **Descrição**: Cria um novo cliente
- **Funcionalidades**:
  - Cadastro com validações
  - Dados de contato

- **Endpoint**: `PUT /api/clients/[id]`
- **Descrição**: Atualiza um cliente
- **Funcionalidades**:
  - Modificação de dados
  - Atualização de contato

- **Endpoint**: `DELETE /api/clients/[id]`
- **Descrição**: Remove um cliente
- **Funcionalidades**:
  - Exclusão com validações de uso

## APIs Removidas/Consolidadas

### ❌ APIs Antigas Removidas:
- `/api/availability/check` (antiga)
- `/api/availability/detailed` (antiga)
- `/api/availability/check-advanced` (antiga)
- `/api/system-availability` (antiga)

### ✅ APIs Consolidadas:
- **`/api/availability`**: API unificada que substitui todas as antigas
  - `GET`: Status atual do sistema
  - `POST`: Verificação de disponibilidade para período específico

## Características Técnicas

### Tecnologias Utilizadas:
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Validações**: Validação de entrada e tratamento de erros
- **Performance**: Conexões otimizadas e desconexão automática

### Padrões de Resposta:
- **Sucesso**: `{ success: true, data: {...} }`
- **Erro**: `{ error: "mensagem de erro" }`
- **Status HTTP**: 200 (sucesso), 400 (erro cliente), 500 (erro servidor)

### Segurança:
- Validação de entrada em todas as APIs
- Tratamento de erros sem exposição de dados sensíveis
- Sanitização de dados antes de consultas ao banco

## Notas de Implementação

### Sistema de Disponibilidade:
- **Baseado em estoque real**: Todas as verificações consideram o estoque cadastrado
- **Integração com locações**: Itens ocupados em locações ativas são automaticamente considerados indisponíveis
- **Cálculo em tempo real**: Disponibilidade é calculada dinamicamente baseada no estado atual do sistema
- **Detalhamento completo**: Para cada item, mostra exatamente quais locações estão ocupando e em que quantidade

### Gestão de Estado:
- **Status de locações**: CONFIRMED, IN_PROGRESS, PENDING, COMPLETED, CANCELLED
- **Status de pagamento**: PAID, PENDING, PARTIAL
- **Status de disponibilidade**: DISPONÍVEL, INDISPONÍVEL

### Validações Implementadas:
- Datas de início devem ser anteriores às de fim
- Quantidades solicitadas devem ser positivas
- Itens devem existir no sistema
- Locações não podem ter períodos sobrepostos para o mesmo item
